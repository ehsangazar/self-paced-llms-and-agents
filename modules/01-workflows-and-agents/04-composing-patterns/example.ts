/**
 * Composing patterns: a router that feeds a chain that ends in a critique loop.
 *
 * Real systems are rarely one pattern. They are two or three, composed, and the
 * composition is where the cost and the failure modes come from. This one is
 * routing -> chaining -> evaluator-optimizer, which covers a surprising amount
 * of production work.
 *
 * Watch two things: the gates between stages (a stage that fails does not feed
 * the next one garbage) and the cap on the loop at the end.
 *
 * Stub model, no API key.
 *
 * Run it:  npm run lab modules/01-workflows-and-agents/04-composing-patterns/example.ts
 */

const MAX_REVISIONS = 2;

type Route = "billing" | "technical" | "unknown";

let calls = 0;
function stub(kind: string, input: string): string {
  calls++;
  if (kind === "classify") {
    if (/refund|charged|invoice/i.test(input)) return "billing";
    if (/error|crash|login/i.test(input)) return "technical";
    return "unknown";
  }
  if (kind === "facts") return "charged 2500 twice on 12 Oct; policy: full refund, once";
  if (kind === "draft") return input.includes("policy") ? "We will refund you." : "We will look into it.";
  if (kind === "critique") return input.includes("5 working days") ? "PASS" : "no timeframe given";
  if (kind === "revise") return input + " The money lands in 5 working days.";
  return "";
}

function handle(message: string): { reply: string; trace: string[] } {
  const trace: string[] = [];

  // Stage 1 · Route. One cheap call decides which pipeline runs at all.
  const route = stub("classify", message) as Route;
  trace.push(`route -> ${route}`);

  // The gate. An unknown route is a human's problem, not a reason to guess.
  if (route === "unknown") {
    trace.push("gate  -> unroutable, handing to a human (0 further calls)");
    return { reply: "(escalated to a human)", trace };
  }

  // Stage 2 · Chain. Gather grounded facts, then draft from the facts only.
  const facts = stub("facts", message);
  trace.push(`facts -> ${facts}`);

  // The second gate: no facts means no draft. Drafting anyway is how a system
  // invents a refund policy that does not exist.
  if (!facts.includes("policy")) {
    trace.push("gate  -> no policy found, refusing to draft");
    return { reply: "(escalated: no policy match)", trace };
  }

  let draft = stub("draft", facts);
  trace.push(`draft -> ${draft}`);

  // Stage 3 · Evaluator-optimizer, capped. Quality without a human in the loop,
  // but never unbounded: "revise until good" is how a cheap task becomes dear.
  for (let i = 0; i < MAX_REVISIONS; i++) {
    const verdict = stub("critique", draft);
    trace.push(`critique -> ${verdict}`);
    if (verdict === "PASS") break;
    draft = stub("revise", draft);
    trace.push(`revise -> ${draft}`);
    if (i === MAX_REVISIONS - 1) trace.push("cap   -> revision limit reached, shipping what we have");
  }

  return { reply: draft, trace };
}

for (const message of [
  "I was charged twice, I want a refund",
  "the weather is nice today",
]) {
  calls = 0;
  console.log(`\n"${message}"`);
  const { reply, trace } = handle(message);
  for (const line of trace) console.log("  " + line);
  console.log(`  reply: ${reply}`);
  console.log(`  ${calls} model call(s)`);
}

console.log(
  "\nThe second message costs one call and stops. That is the composition doing its\n" +
    "job: the cheapest stage runs first and is allowed to end the request. Most of\n" +
    "the value in composing patterns is not the clever last stage, it is the gates\n" +
    "between them deciding not to spend.",
);

export {};
