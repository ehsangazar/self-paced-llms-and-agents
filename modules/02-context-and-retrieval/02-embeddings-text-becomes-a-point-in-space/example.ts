/**
 * An embedding you can read: text becomes a point, and near means related.
 *
 * Real embeddings are 1536 opaque floats from a model. The mechanics are the
 * same as the toy below: text in, a vector out, and similarity is the angle
 * between two vectors. Building the toy makes the two things that actually bite
 * you obvious, and both survive into production:
 *
 *   1. keyword overlap and meaning are not the same thing
 *   2. the vector only knows what the encoder was trained to notice
 *
 * Pure arithmetic, no API key. Set OPENROUTER_API_KEY and swap the encoder for
 * a real one when you want to see the difference.
 *
 * Run it:  npm run lab modules/02-context-and-retrieval/02-embeddings-text-becomes-a-point-in-space/example.ts
 */

// A tiny hand-built encoder: each dimension is a concept, and a document scores
// on a dimension if it mentions any of that concept's words. This is a bag of
// words with a theme, which is roughly what an embedding is, learned instead of
// declared.
const DIMENSIONS: { name: string; words: string[] }[] = [
  { name: "money", words: ["refund", "charge", "charged", "payment", "invoice", "billing", "price"] },
  { name: "time", words: ["days", "delay", "wait", "immediately", "slow", "long"] },
  { name: "auth", words: ["login", "password", "sign", "token", "locked", "access"] },
  { name: "anger", words: ["furious", "unacceptable", "terrible", "angry", "worst"] },
];

function embed(text: string): number[] {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const raw = DIMENSIONS.map((d) => words.filter((w) => d.words.includes(w)).length);
  const norm = Math.sqrt(raw.reduce((n, v) => n + v * v, 0)) || 1;
  return raw.map((v) => v / norm);                       // unit length, so cosine is a dot product
}

function cosine(a: number[], b: number[]): number {
  return a.reduce((n, v, i) => n + v * (b[i] ?? 0), 0);
}

const corpus = [
  "I was charged twice and want a refund",
  "My refund is taking too long, it has been ten days",
  "I cannot log in, my password stopped working",
  "This is unacceptable, worst service ever",
];

const query = "where is my money";                        // no shared word with anything

console.log("The space (each row is a point):\n");
console.log("                                                  " + DIMENSIONS.map((d) => d.name.padStart(7)).join(""));
for (const doc of corpus) {
  const v = embed(doc);
  console.log(`  ${doc.slice(0, 46).padEnd(48)}${v.map((n) => n.toFixed(2).padStart(7)).join("")}`);
}

console.log(`\nQuery: "${query}"`);
const qv = embed(query);
const ranked = corpus
  .map((doc) => ({ doc, score: cosine(qv, embed(doc)) }))
  .sort((a, b) => b.score - a.score);
for (const r of ranked) console.log(`  ${r.score.toFixed(3)}  ${r.doc}`);

console.log(
  "\nEvery score is 0.000, and that is the lesson. 'Money' is not in any document\n" +
    "and not in the encoder's vocabulary, so the query lands at the origin and is\n" +
    "equidistant from everything. A real embedding model would place it near the\n" +
    "refund complaints, because it learned that money and refund and charge live\n" +
    "in the same neighbourhood.\n" +
    "\n" +
    "That is the whole argument for embeddings over keyword search, and also the\n" +
    "warning: what the encoder never learned to notice, your retriever cannot see.\n" +
    "Try the query below to watch the same space work when the words do line up.",
);

const query2 = "charged twice, need a refund";
console.log(`\nQuery: "${query2}"`);
const qv2 = embed(query2);
for (const r of corpus
  .map((doc) => ({ doc, score: cosine(qv2, embed(doc)) }))
  .sort((a, b) => b.score - a.score)) {
  console.log(`  ${r.score.toFixed(3)}  ${r.doc}`);
}

export {};
