/**
 * The framework as a thing you run: it writes the design doc skeleton for you,
 * with your answers in it and the gaps still marked as gaps.
 *
 * The seven sections are not a template to admire, they are seven questions
 * that a reviewer will ask. Filling them in before the review is the whole
 * technique. Anything you cannot answer stays in the output as TODO, because a
 * design doc that hides its unknowns is worse than one that lists them.
 *
 * Edit SYSTEM below to describe your own system and run it again.
 *
 * Run it:  npm run lab modules/07-capstone/01-llm-design-framework/example.ts
 */

interface Design {
  name: string;
  jobToBeDone: string;
  boundary: { model: string[]; code: string[] };
  context: { sources: string[]; excluded: string[] };
  budget: { p95Ms?: number; costPerRequestUsd?: number; escalationRate?: string };
  failure: { mode: string; response: string }[];
  security: { threat: string; mitigation: string }[];
  evals: { name: string; passBar: string }[];
}

const SYSTEM: Design = {
  name: "Support triage assistant",
  jobToBeDone: "Route an incoming ticket and draft a first reply a human sends or edits.",
  boundary: {
    model: ["classify intent", "draft the reply text"],
    code: ["decide the route", "apply refund policy", "send anything to a customer"],
  },
  context: {
    sources: ["the ticket", "the order record", "the refund policy page"],
    excluded: ["the customer's other tickets (privacy, and it makes the model wander)"],
  },
  budget: { p95Ms: 4000, costPerRequestUsd: 0.004 },
  failure: [
    { mode: "model times out", response: "fall back to keyword routing, no draft" },
    { mode: "retrieval returns nothing", response: "refuse to draft, escalate to a human" },
  ],
  security: [
    { threat: "prompt injection via ticket text", mitigation: "fence the ticket, no write tools on this path" },
  ],
  evals: [],   // deliberately empty: watch what the framework does with it
};

const SECTIONS: { title: string; render: (d: Design) => string[] }[] = [
  { title: "1. What it does, and for whom", render: (d) => [d.jobToBeDone] },
  {
    title: "2. The code/model boundary",
    render: (d) => [
      `Model decides: ${d.boundary.model.join("; ") || "TODO"}`,
      `Code decides: ${d.boundary.code.join("; ") || "TODO"}`,
    ],
  },
  {
    title: "3. Context and retrieval",
    render: (d) => [
      `In the window: ${d.context.sources.join("; ") || "TODO"}`,
      `Deliberately out: ${d.context.excluded.join("; ") || "TODO"}`,
    ],
  },
  {
    title: "4. Cost and latency budget",
    render: (d) => [
      d.budget.p95Ms ? `p95 latency: ${d.budget.p95Ms}ms` : "TODO: p95 latency ceiling",
      d.budget.costPerRequestUsd ? `cost/request: $${d.budget.costPerRequestUsd}` : "TODO: cost per request",
      d.budget.escalationRate ? `escalation rate: ${d.budget.escalationRate}` : "TODO: expected escalation rate",
    ],
  },
  {
    title: "5. How it fails, and what happens then",
    render: (d) => (d.failure.length ? d.failure.map((f) => `${f.mode} -> ${f.response}`) : ["TODO: name at least three"]),
  },
  {
    title: "6. Threats and mitigations",
    render: (d) => (d.security.length ? d.security.map((s) => `${s.threat} -> ${s.mitigation}`) : ["TODO: start with injection"]),
  },
  {
    title: "7. How you know it works",
    render: (d) => (d.evals.length ? d.evals.map((e) => `${e.name}, passes at ${e.passBar}`) : ["TODO: no evals defined"]),
  },
];

const lines: string[] = [`# ${SYSTEM.name}`, ""];
let todos = 0;
for (const s of SECTIONS) {
  lines.push(`## ${s.title}`);
  for (const line of s.render(SYSTEM)) {
    if (line.startsWith("TODO")) todos++;
    lines.push(`- ${line}`);
  }
  lines.push("");
}

console.log(lines.join("\n"));
console.log(`${todos} open question(s) in this design.\n`);
console.log(
  todos === 0
    ? "Nothing outstanding. Take it to a review and see which answer does not survive."
    : "Those TODOs are the review, arriving early and cheaply. The evals section is\n" +
        "empty here on purpose: it is the one people leave until last, and it is the\n" +
        "one that decides whether any of the rest is true.",
);

export {};
