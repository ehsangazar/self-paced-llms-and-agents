/**
 * Retrieval as a tool the model calls, versus retrieval you always run.
 *
 * Classic RAG retrieves once, up front, for every request. Agentic retrieval
 * gives the model a search tool and lets it decide whether to search, what to
 * search for, and when it has enough. It is strictly more capable and strictly
 * less predictable, and the second half of that sentence is the reason to think
 * before reaching for it.
 *
 * Both run below over the same corpus with the same stub model, no API key.
 * Compare the searches each one performs on a question the first query cannot
 * answer alone.
 *
 * Run it:  npm run lab modules/02-context-and-retrieval/04-retrieval-as-a-tool-the-model-calls-in-a-loop/example.ts
 */

const CORPUS: { id: string; text: string }[] = [
  { id: "refunds", text: "Refunds are issued in full for duplicate charges, once per order." },
  { id: "timing", text: "Refunded money lands in the customer's account in 5 to 10 working days." },
  { id: "chargebacks", text: "If a chargeback is open, do not refund: that pays the customer twice." },
  { id: "shipping", text: "Standard shipping takes 3 working days." },
];

let searches = 0;
function search(query: string, k = 2): typeof CORPUS {
  searches++;
  const terms = query.toLowerCase().match(/[a-z]+/g) ?? [];
  return CORPUS.map((d) => ({ d, score: terms.filter((t) => d.text.toLowerCase().includes(t)).length }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((r) => r.d);
}

const QUESTION = "customer opened a chargeback and also wants a refund, how long does it take";

// ------------------------------------------------------- retrieve once, up front --
console.log("CLASSIC RAG: one retrieval, then answer");
searches = 0;
const once = search(QUESTION);
console.log(`  searched: ${JSON.stringify(QUESTION.slice(0, 40))}…`);
console.log(`  got: ${once.map((d) => d.id).join(", ") || "(nothing)"}`);
console.log(`  answer is written from those ${once.length} passages, whatever is missing`);
const classicSearches = searches;

// ------------------------------------------------------------ retrieval as a tool --
console.log("\nAGENTIC: the model decides what to search for, and when to stop");
searches = 0;
const gathered = new Map<string, string>();
const MAX_SEARCHES = 4;

// The planner. A real model emits these as tool calls; the control flow is
// identical, which is the thing worth seeing.
function nextQuery(known: Set<string>): string | null {
  if (!known.has("chargebacks")) return "chargeback refund";
  if (!known.has("refunds")) return "duplicate charge refund policy";
  if (!known.has("timing")) return "how long does refunded money take to land";
  return null;                                        // enough to answer
}

for (let step = 0; step < MAX_SEARCHES; step++) {
  const q = nextQuery(new Set(gathered.keys()));
  if (q === null) {
    console.log("  model: I have enough, answering");
    break;
  }
  const hits = search(q);
  for (const h of hits) gathered.set(h.id, h.text);
  console.log(`  search(${JSON.stringify(q)}) -> ${hits.map((h) => h.id).join(", ") || "(nothing)"}`);
  if (step === MAX_SEARCHES - 1) console.log("  cap reached, answering with what we have");
}

console.log(`  gathered: ${[...gathered.keys()].join(", ")}`);

console.log(
  `\nSearches: classic ${classicSearches}, agentic ${searches}.\n\n` +
    "The question has two halves, and one search over the whole sentence found two\n" +
    "passages but missed the refund policy. The loop asked narrower questions and\n" +
    "gathered all three, including the chargeback rule, which is the one that turns\n" +
    "the answer from 'here is your refund' into 'do not refund'. It paid for the\n" +
    "extra searches and it needed a cap, because a model that decides when to stop\n" +
    "is a model that can decide not to.",
);

export {};
