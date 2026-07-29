/**
 * The five patterns, side by side, on one task.
 *
 * The lesson names them. This runs all five against the same request with the
 * same stub model, and prints what each one cost. Reading the numbers is the
 * exercise: the patterns are ordered simplest to most dynamic, and the cost
 * climbs in the same direction. That ordering is the whole reason to reach
 * left first.
 *
 * The model is stubbed, so this needs no API key and the costs are stable.
 * The runnable versions that call a real model are next door, in
 * 01-s01-why-demos-die/patterns/.
 *
 * Run it:  npm run lab modules/01-workflows-and-agents/03-the-five-workflow-patterns/example.ts
 */

const PRICE_PER_1K = 0.0006;

let tokens = 0;
let calls = 0;
function stub(kind: string, input: string): string {
  calls++;
  tokens += Math.ceil(input.length / 4) + 60;
  if (kind === "classify") return input.includes("refund") ? "billing" : "technical";
  if (kind === "critique") return input.includes("v3") ? "PASS" : "too vague, name the timeframe";
  return `${kind}(${input.slice(0, 24)}…)`;
}

interface Result { name: string; calls: number; tokens: number; note: string }

function measure(name: string, note: string, run: () => void): Result {
  tokens = 0;
  calls = 0;
  run();
  return { name, calls, tokens, note };
}

const request = "I was charged twice last month and I want a refund";

// 1 · Prompt chaining: fixed steps, each gated on the last.
const chaining = measure("chaining", "gate between steps, cheapest to make reliable", () => {
  const outline = stub("outline", request);
  if (outline.length > 0) stub("write", outline);
});

// 2 · Routing: classify once, then one specialised handler.
const routing = measure("routing", "one extra small call, saves the big one", () => {
  const route = stub("classify", request);
  stub(`handle:${route}`, request);
});

// 3 · Parallelization: independent branches, then aggregate.
const parallel = measure("parallelization", "wall-clock win, token cost multiplies", () => {
  const branches = ["sentiment", "entities", "urgency"].map((b) => stub(b, request));
  stub("aggregate", branches.join(" "));
});

// 4 · Orchestrator-workers: the branches are chosen at run time.
const orchestrated = measure("orchestrator", "branches decided by the model, cost unpredictable", () => {
  const plan = stub("plan", request);
  for (const worker of ["lookup-charges", "check-policy"]) stub(worker, plan);
  stub("synthesise", plan);
});

// 5 · Evaluator-optimizer: generate, critique, revise, until it passes.
const evaluated = measure("evaluator-optimizer", "quality without a human, ALWAYS cap the loop", () => {
  let draft = stub("draft", request);
  for (let i = 0; i < 3; i++) {           // the cap is the pattern, not an optimisation
    const verdict = stub("critique", draft);
    if (verdict === "PASS") break;
    draft = stub("revise", `v${i + 3} ${draft}`);
  }
});

console.log("pattern              calls  tokens     cost   note");
for (const r of [chaining, routing, parallel, orchestrated, evaluated]) {
  const cost = `$${((r.tokens / 1000) * PRICE_PER_1K).toFixed(5)}`;
  console.log(`${r.name.padEnd(20)} ${String(r.calls).padStart(5)}  ${String(r.tokens).padStart(6)}  ${cost.padStart(7)}   ${r.note}`);
}

console.log(
  "\nEvery rung to the right buys you flexibility and charges you for it. Reach\n" +
    "left first: most features are perfectly happy on chaining or routing, and the\n" +
    "two on the right are where an unbounded loop turns a five dollar task into\n" +
    "fifty.",
);

export {};
