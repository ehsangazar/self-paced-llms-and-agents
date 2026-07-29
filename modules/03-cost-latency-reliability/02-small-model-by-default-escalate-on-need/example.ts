/**
 * Small model by default, escalate on need, and what the escalation gate costs.
 *
 * "Use the big model" is a decision you make once and pay for on every request.
 * The alternative is a gate: run the small model, check whether its answer is
 * good enough by a rule you can state, and escalate only when it is not.
 *
 * The interesting number is not the saving, it is the break-even. Escalating
 * costs you both models, so the strategy only wins while the escalation rate
 * stays below a threshold this file computes for you.
 *
 * Stubbed model, no API key, deterministic numbers.
 *
 * Run it:  npm run lab modules/03-cost-latency-reliability/02-small-model-by-default-escalate-on-need/example.ts
 */

const PRICE = { small: 0.15 / 1_000_000, large: 5.0 / 1_000_000 };   // dollars per token
const TOKENS = { in: 800, out: 200 };

const costOf = (tier: "small" | "large") => (TOKENS.in + TOKENS.out) * PRICE[tier];

interface Request { text: string; hard: boolean }

// A stub: the small model refuses (low confidence) on the hard ones.
function ask(tier: "small" | "large", req: Request): { answer: string; confidence: number } {
  if (tier === "large") return { answer: "grounded answer", confidence: 0.95 };
  return req.hard
    ? { answer: "I am not sure", confidence: 0.34 }
    : { answer: "grounded answer", confidence: 0.91 };
}

const CONFIDENCE_FLOOR = 0.7;

function answerWithEscalation(req: Request): { answer: string; cost: number; escalated: boolean } {
  const small = ask("small", req);
  if (small.confidence >= CONFIDENCE_FLOOR) {
    return { answer: small.answer, cost: costOf("small"), escalated: false };
  }
  const large = ask("large", req);                        // you now pay for both
  return { answer: large.answer, cost: costOf("small") + costOf("large"), escalated: true };
}

// A realistic mix: most traffic is easy, a minority genuinely needs the big model.
const HARD_SHARE = 0.2;
const N = 10_000;
const traffic: Request[] = Array.from({ length: N }, (_, i) => ({
  text: `request ${i}`,
  hard: i % Math.round(1 / HARD_SHARE) === 0,
}));

let escalationCost = 0;
let escalations = 0;
for (const req of traffic) {
  const r = answerWithEscalation(req);
  escalationCost += r.cost;
  if (r.escalated) escalations++;
}

const alwaysLarge = N * costOf("large");
const alwaysSmall = N * costOf("small");
const rate = escalations / N;

console.log(`Over ${N.toLocaleString()} requests, ${(rate * 100).toFixed(1)}% escalated.\n`);
console.log(`  always large      $${alwaysLarge.toFixed(2)}   the default nobody revisits`);
console.log(`  small + escalate  $${escalationCost.toFixed(2)}   ${(100 - (escalationCost / alwaysLarge) * 100).toFixed(1)}% cheaper`);
console.log(`  always small      $${alwaysSmall.toFixed(2)}   and wrong on ${(HARD_SHARE * 100).toFixed(0)}% of them`);

// Break-even: escalating pays both, so it stops winning once the rate is high
// enough that (small + rate*(small+large)) exceeds large.
const breakEven = (costOf("large") - costOf("small")) / (costOf("small") + costOf("large"));
console.log(`\nBreak-even escalation rate: ${(breakEven * 100).toFixed(1)}%.`);
console.log(
  "Above that, the gate costs more than it saves and you should just call the big\n" +
    "model. This is the number to put on a dashboard: escalation rate is a cost\n" +
    "metric, and it drifts as your traffic changes. A gate nobody measures is a\n" +
    "saving nobody can prove.",
);

export {};
