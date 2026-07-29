/**
 * Control and observability, as two functions you can point at.
 *
 * The words sound abstract until you write them down. They are not:
 *
 *   control        the decisions your code keeps: the model may suggest, your
 *                  code decides what actually happens
 *   observability  the record of what happened: what went in, what came back,
 *                  what it cost, what you did about it
 *
 * The same request runs three times below, with neither, with one, and with
 * both, so the difference is a diff rather than a definition. No API key.
 *
 * Run it:  npm run lab modules/00-start-here/03-sh-3-control-and-observability/example.ts
 */

interface Suggestion { action: "refund" | "reply"; amountCents: number }

const MAX_AUTO_REFUND_CENTS = 5_000;
const ledger: string[] = [];

/** The model, having a bad day: it wants to refund far more than the order. */
function suggest(): Suggestion {
  return { action: "refund", amountCents: 250_000 };
}

function refund(cents: number): void {
  ledger.push(`refunded ${cents}`);
}

// ------------------------------------------------- neither: suggestion = action --
function neither(): string {
  const s = suggest();
  if (s.action === "refund") refund(s.amountCents);
  return "done";
}

// ------------------------------------------ control only: your code still decides --
function controlOnly(): string {
  const s = suggest();
  if (s.action === "refund" && s.amountCents <= MAX_AUTO_REFUND_CENTS) {
    refund(s.amountCents);
    return "refunded";
  }
  return "held for review";           // it happened, and you cannot say why
}

// ------------------------------------------------------------------ both --------
interface Record_ { suggested: Suggestion; decision: string; reason: string; ms: number }
const records: Record_[] = [];

function both(): string {
  const t0 = Date.now();
  const s = suggest();
  const overLimit = s.amountCents > MAX_AUTO_REFUND_CENTS;
  const decision = s.action === "refund" && !overLimit ? "auto-refunded" : "held for review";
  const reason = overLimit
    ? `amount ${s.amountCents} exceeds the ${MAX_AUTO_REFUND_CENTS} auto limit`
    : "within policy";
  if (decision === "auto-refunded") refund(s.amountCents);
  records.push({ suggested: s, decision, reason, ms: Date.now() - t0 });
  return decision;
}

console.log("NEITHER");
ledger.length = 0;
console.log(`  result: ${neither()}`);
console.log(`  ledger: ${ledger.join(", ")}   <- a 2500 dollar refund, unreviewed`);

console.log("\nCONTROL ONLY");
ledger.length = 0;
console.log(`  result: ${controlOnly()}`);
console.log(`  ledger: ${ledger.length ? ledger.join(", ") : "(empty, the limit held)"}`);
console.log("  but when someone asks why it was held, you have nothing to show them");

console.log("\nBOTH");
ledger.length = 0;
console.log(`  result: ${both()}`);
console.log(`  ledger: ${ledger.length ? ledger.join(", ") : "(empty, the limit held)"}`);
for (const r of records) {
  console.log(`  record: suggested ${r.suggested.action} ${r.suggested.amountCents} -> ${r.decision}`);
  console.log(`          reason: ${r.reason}  (${r.ms}ms)`);
}

console.log(
  "\nControl is the limit. Observability is the record of the limit doing its job.\n" +
    "Neither is a feature you add later: the first is a decision about where the\n" +
    "model's authority ends, and the second is the only reason you will ever be\n" +
    "able to explain what your system did. Every module from here on assumes both.",
);

export {};
