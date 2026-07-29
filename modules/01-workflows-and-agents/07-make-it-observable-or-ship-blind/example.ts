/**
 * Ship blind, then ship the same thing with a trace around it.
 *
 * The first run prints an answer. The second prints an answer and everything
 * you would need at 2am: what each step saw, what it cost, how long it took,
 * and which step was the slow one. Same pipeline, ~30 lines of difference.
 *
 * No API key: the model is stubbed with a fixed latency and token count, so the
 * trace is stable and you can read it as a shape rather than as numbers.
 *
 * Run it:  npm run lab modules/01-workflows-and-agents/07-make-it-observable-or-ship-blind/example.ts
 */

const PRICE_PER_1K_TOKENS = 0.0006;

interface Span {
  name: string;
  ms: number;
  tokensIn: number;
  tokensOut: number;
  attributes: Record<string, string | number>;
}

/** The whole of "observability" for one request: a list, and something to print it. */
class Trace {
  readonly spans: Span[] = [];
  private startedAt = 0;

  async step<T>(
    name: string,
    attributes: Record<string, string | number>,
    fn: () => Promise<{ value: T; tokensIn: number; tokensOut: number }>,
  ): Promise<T> {
    const t0 = Date.now();
    if (this.startedAt === 0) this.startedAt = t0;
    const { value, tokensIn, tokensOut } = await fn();
    this.spans.push({ name, ms: Date.now() - t0, tokensIn, tokensOut, attributes });
    return value;
  }

  report(): void {
    const total = this.spans.reduce((n, s) => n + s.ms, 0);
    const tokens = this.spans.reduce((n, s) => n + s.tokensIn + s.tokensOut, 0);
    const cost = (tokens / 1000) * PRICE_PER_1K_TOKENS;
    console.log("  trace");
    for (const s of this.spans) {
      const share = Math.round((s.ms / Math.max(total, 1)) * 100);
      const bar = "#".repeat(Math.max(1, Math.round(share / 5)));
      const attrs = Object.entries(s.attributes).map(([k, v]) => `${k}=${v}`).join(" ");
      console.log(
        `    ${s.name.padEnd(18)} ${String(s.ms).padStart(5)}ms ${bar.padEnd(20)} ${share}%  ` +
          `${s.tokensIn}->${s.tokensOut} tok  ${attrs}`,
      );
    }
    console.log(`    ${"total".padEnd(18)} ${String(total).padStart(5)}ms  ${tokens} tokens  $${cost.toFixed(5)}`);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function stubModel(step: string, input: string) {
  const latency = step === "retrieve" ? 40 : step === "answer" ? 220 : 30;
  await sleep(latency);
  return {
    value: step === "answer" ? `Refunds take 5 working days (asked: ${input.slice(0, 20)}...)` : `${step}:ok`,
    tokensIn: input.length,
    tokensOut: step === "answer" ? 180 : 12,
  };
}

// ------------------------------------------------------------------- blind --
async function blind(question: string): Promise<string> {
  await stubModel("classify", question);
  await stubModel("retrieve", question);
  const answer = await stubModel("answer", question);
  return answer.value;
}

// ------------------------------------------------------------- observable --
async function observable(question: string): Promise<string> {
  const trace = new Trace();
  const category = await trace.step("classify", { model: "small" }, () => stubModel("classify", question));
  await trace.step("retrieve", { hits: 3, source: "docs" }, () => stubModel("retrieve", question));
  const answer = await trace.step("answer", { model: "large", category }, () => stubModel("answer", question));
  trace.report();
  return answer;
}

const question = "how long do refunds take?";

console.log("BLIND");
console.log("  " + (await blind(question)));
console.log("  ...and that is everything you have when someone reports it was wrong.\n");

console.log("OBSERVABLE");
const answer = await observable(question);
console.log("  " + answer);
console.log(
  "\nThe answer is identical. The difference is that you can now name the slow step,\n" +
    "say what the classifier decided, and price the request, without reproducing\n" +
    "anything. Add this on day one: it is far harder to retrofit a trace than to\n" +
    "carry one from the start.",
);

// This file imports nothing, so mark it a module: without it TypeScript treats
// every example as one global script and their top-level names collide.
export {};
