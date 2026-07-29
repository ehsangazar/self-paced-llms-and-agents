/**
 * Five ways the output betrays you, and the one gate that catches all five.
 *
 * Every failure below is a real thing models do to well-formed prompts. None
 * of them are caught by reading the reply and thinking "looks right". All of
 * them are caught by refusing to accept anything that does not parse against a
 * schema you declared first.
 *
 * The betrayals are canned strings here, so this runs offline and always shows
 * the same five failures. That is the point: you can test this.
 *
 * Run it:  npm run lab modules/01-workflows-and-agents/06-five-ways-the-model-s-output-betrays-you/example.ts
 */
import { z } from "zod";

const Refund = z.object({
  decision: z.enum(["approve", "deny", "escalate"]),
  amountCents: z.number().int().nonnegative(),
  reason: z.string().min(1),
});

// What the model actually returns on a bad day. Each of these came back from a
// prompt that asked, politely and precisely, for JSON matching the schema.
const betrayals: { name: string; raw: string }[] = [
  {
    name: "1. Prose around the JSON",
    raw: 'Sure! Here is the decision:\n```json\n{"decision":"approve","amountCents":2500,"reason":"duplicate charge"}\n```\nLet me know if you need anything else.',
  },
  {
    name: "2. Right shape, invented enum value",
    raw: '{"decision":"partial-approve","amountCents":2500,"reason":"duplicate charge"}',
  },
  {
    name: "3. Right key, wrong type (money as a string)",
    raw: '{"decision":"approve","amountCents":"25.00","reason":"duplicate charge"}',
  },
  {
    name: "4. Confidently wrong: a negative refund",
    raw: '{"decision":"approve","amountCents":-2500,"reason":"duplicate charge"}',
  },
  {
    name: "5. Silently dropped field",
    raw: '{"decision":"escalate","amountCents":0}',
  },
];

/** Strip the chat around the JSON. Not a fix, just the first thing to try. */
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  return first >= 0 && last > first ? raw.slice(first, last + 1) : raw;
}

/** The gate. Nothing reaches your business logic without passing this. */
function parseRefund(raw: string): { ok: true; value: z.infer<typeof Refund> } | { ok: false; why: string } {
  let json: unknown;
  try {
    json = JSON.parse(extractJson(raw));
  } catch {
    return { ok: false, why: "not JSON at all, even after unwrapping the chat" };
  }
  const result = Refund.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { ok: false, why: issue ? `${issue.path.join(".") || "(root)"}: ${issue.message}` : "failed validation" };
  }
  return { ok: true, value: result.data };
}

let caught = 0;
for (const { name, raw } of betrayals) {
  const parsed = parseRefund(raw);
  if (parsed.ok) {
    console.log(`${name}\n   PASSED the gate -> refund ${parsed.value.amountCents} cents\n`);
  } else {
    caught++;
    console.log(`${name}\n   REJECTED -> ${parsed.why}\n`);
  }
}

console.log(`${caught} of ${betrayals.length} rejected at the boundary.`);
console.log(
  "Note which one got through: the prose-wrapped reply, because unwrapping is a\n" +
    "parsing problem, not a trust problem. The other four were structurally\n" +
    "plausible and semantically wrong, and only the schema knew the difference.\n" +
    "A retry here is cheap. A negative refund in your ledger is not.",
);
