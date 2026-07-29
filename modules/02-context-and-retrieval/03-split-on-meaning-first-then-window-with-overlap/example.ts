/**
 * Three chunkers on the same document, and the question each one can answer.
 *
 * Fixed-size splitting is the default in every quickstart and it is the reason
 * so many RAG systems retrieve a paragraph that stops mid-sentence. Split on
 * meaning first (headings, then sentences), window only to enforce a budget,
 * and overlap so a fact that straddles a boundary survives.
 *
 * Pure string handling, no API key, no embeddings. Run it and read the last
 * section: one chunker loses the answer entirely.
 *
 * Run it:  npm run lab modules/02-context-and-retrieval/03-split-on-meaning-first-then-window-with-overlap/example.ts
 */

const DOC = `# Refunds
A refund returns the full amount to the original payment method.

## Timing
Refunds are issued immediately on our side. The money lands in the customer's
account in 5 to 10 working days, because the delay is at their bank, not with us.

## Partial refunds
A partial refund is allowed once per order. The remainder stays captured.

## Chargebacks
A chargeback is not a refund. If a chargeback is opened, do not also refund:
that pays the customer twice and the ledger will not balance.`;

const CHUNK_CHARS = 220;
const OVERLAP_CHARS = 60;

/** 1 · Fixed size. Cheap, fast, and it cuts wherever the counter lands. */
function fixed(doc: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < doc.length; i += CHUNK_CHARS) out.push(doc.slice(i, i + CHUNK_CHARS));
  return out;
}

/** 2 · Fixed size with overlap. The straddling fact survives, duplicated. */
function fixedOverlap(doc: string): string[] {
  const out: string[] = [];
  const step = CHUNK_CHARS - OVERLAP_CHARS;
  for (let i = 0; i < doc.length; i += step) out.push(doc.slice(i, i + CHUNK_CHARS));
  return out;
}

/** 3 · Meaning first: split on headings, then sentences, then window to budget. */
function bySemantics(doc: string): string[] {
  const sections = doc.split(/\n(?=#{1,6} )/);          // keep the heading with its body
  const out: string[] = [];
  for (const section of sections) {
    if (section.length <= CHUNK_CHARS) {
      out.push(section.trim());
      continue;
    }
    const heading = section.split("\n")[0] ?? "";
    const sentences = section.split(/(?<=[.!?])\s+/);
    let buf = "";
    for (const s of sentences) {
      if ((buf + " " + s).trim().length > CHUNK_CHARS && buf) {
        out.push(`${heading}\n${buf.trim()}`);           // carry the heading into every piece
        buf = s;
      } else {
        buf += " " + s;
      }
    }
    if (buf.trim()) out.push(`${heading}\n${buf.trim()}`);
  }
  return out;
}

const QUESTION = "how long until the money lands?";
const ANSWER_TERMS = ["5 to 10 working days", "their bank"];

/** Naive keyword scoring, standing in for a retriever. */
function best(chunks: string[]): { chunk: string; score: number } {
  let winner = { chunk: "", score: 0 };
  for (const c of chunks) {
    const score = ANSWER_TERMS.filter((t) => c.includes(t)).length;
    if (score > winner.score) winner = { chunk: c, score };
  }
  return winner;
}

for (const [name, chunks] of [
  ["fixed", fixed(DOC)],
  ["fixed + overlap", fixedOverlap(DOC)],
  ["meaning first", bySemantics(DOC)],
] as const) {
  const { chunk, score } = best(chunks);
  const sizes = chunks.map((c) => c.length);
  console.log(`\n${name.toUpperCase()}  ${chunks.length} chunks, ${Math.min(...sizes)}-${Math.max(...sizes)} chars`);
  console.log(`  question: "${QUESTION}"`);
  console.log(`  best chunk holds ${score}/${ANSWER_TERMS.length} of the answer:`);
  console.log("  " + (chunk ? JSON.stringify(chunk.slice(0, 150)) : "(nothing matched)"));
}

console.log(
  "\nThe fact is one sentence that spans a line break, and fixed splitting cuts it\n" +
    "in half: you retrieve '5 to 10 working days' with no idea what it refers to, or\n" +
    "the context with no number. Overlap patches that by paying for duplication.\n" +
    "Splitting on meaning keeps the heading attached, so the chunk is self-\n" +
    "describing and the retriever has something to match on.",
);

export {};
