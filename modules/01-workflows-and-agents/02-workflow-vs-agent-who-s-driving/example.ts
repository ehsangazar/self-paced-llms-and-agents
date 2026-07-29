/**
 * Who's driving: the same task as a workflow, then as an agent.
 *
 * The difference is not the model, the prompt, or the framework. It is who
 * decides what happens next. In the workflow the steps are in your code; in
 * the agent the model picks the next move and you find out at run time.
 *
 * Both runs below use the same stub model, so the output is deterministic and
 * this file needs no API key. The point is the trace, not the answer: count
 * the calls and notice which run you could have predicted before it started.
 *
 * Run it:  npm run lab modules/01-workflows-and-agents/02-workflow-vs-agent-who-s-driving/example.ts
 */

interface Ticket {
  text: string;
  customerTier: "free" | "paid";
}

// A stand-in for the model. Deterministic, so the lesson is about control flow
// rather than about what a real model happened to say today.
let calls = 0;
function stubModel(prompt: string, input: string): string {
  calls++;
  if (prompt.startsWith("classify")) return input.includes("refund") ? "billing" : "technical";
  if (prompt.startsWith("summarise")) return input.slice(0, 40) + "...";
  if (prompt.startsWith("draft")) return `Thanks for getting in touch about: ${input}`;
  if (prompt.startsWith("decide")) {
    // The agent's planner. This is the line that makes it an agent: the next
    // step is model output, not a branch you wrote.
    if (!input.includes("classified")) return "classify";
    if (!input.includes("summarised")) return "summarise";
    if (!input.includes("drafted")) return "draft";
    return "done";
  }
  return "";
}

// ---------------------------------------------------------------- workflow --
// You wrote the steps. Reading this function tells you exactly what will
// happen, in what order, and how many model calls it costs: three, always.
function asWorkflow(ticket: Ticket): string {
  const trace: string[] = [];

  const category = stubModel("classify", ticket.text);
  trace.push(`classify -> ${category}`);

  const summary = stubModel("summarise", ticket.text);
  trace.push(`summarise -> ${summary}`);

  const reply = stubModel("draft", summary);
  trace.push(`draft -> ${reply}`);

  console.log("  " + trace.join("\n  "));
  return reply;
}

// ------------------------------------------------------------------- agent --
// The model picks the next step from what it has observed so far. Same three
// steps today. Tomorrow, on a different ticket, maybe five, maybe two, maybe a
// loop that never ends, which is why the step cap below is not optional.
function asAgent(ticket: Ticket, maxSteps = 6): string {
  const observations: string[] = [];
  const trace: string[] = [];
  let reply = "";

  for (let step = 0; step < maxSteps; step++) {
    const next = stubModel("decide", observations.join(" "));
    trace.push(`decide -> ${next}`);
    if (next === "done") break;

    if (next === "classify") {
      observations.push(`classified:${stubModel("classify", ticket.text)}`);
    } else if (next === "summarise") {
      observations.push(`summarised:${stubModel("summarise", ticket.text)}`);
    } else if (next === "draft") {
      reply = stubModel("draft", ticket.text);
      observations.push("drafted");
    }
    trace.push(`  observed: ${observations[observations.length - 1]}`);
  }

  console.log("  " + trace.join("\n  "));
  return reply;
}

const ticket: Ticket = { text: "I was charged twice, I need a refund", customerTier: "paid" };

console.log("WORKFLOW (steps fixed in code)");
calls = 0;
asWorkflow(ticket);
const workflowCalls = calls;

console.log("\nAGENT (steps chosen at run time)");
calls = 0;
asAgent(ticket);
const agentCalls = calls;

console.log(`\nModel calls: workflow ${workflowCalls}, agent ${agentCalls}.`);
console.log(
  "The agent paid for a planning call before every action. That is the price of\n" +
    "letting it decide, and you pay it on every request, forever. Buy it only when\n" +
    "the task genuinely cannot be scripted.",
);

// This file imports nothing, so mark it a module: without it TypeScript treats
// every example as one global script and their top-level names collide.
export {};
