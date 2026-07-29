/**
 * The ReAct loop, with nothing hidden: thought, action, observation, repeat.
 *
 * Frameworks make this three lines and a decorator. Written out, it is a while
 * loop with a model call at the top, and every hard thing about agents is
 * visible in it: the loop needs a cap, the observation has to come back as data
 * you can trust, and a repeated action means it is stuck.
 *
 * Stubbed planner, so it runs offline and the same way every time. Change
 * MAX_STEPS to 2 and watch it hit the cap mid-task, which is exactly what a
 * real agent does when the task is harder than you assumed.
 *
 * Run it:  npm run lab modules/04-agent-architecture-and-security/02-thought-action-observation-on-repeat/example.ts
 */

const MAX_STEPS = 6;

interface Step { thought: string; action: string; input: string }

// The tools. Note that each returns a string: the model gets text back, so
// anything structured has to survive a round trip through prose.
const tools: Record<string, (input: string) => string> = {
  lookup_order: (id) => (id === "A-1029" ? "order A-1029: charged 2500 twice on 12 Oct" : "no such order"),
  refund_policy: () => "duplicate charges are refunded in full, once, without approval",
  issue_refund: (arg) => `refunded ${arg}`,
};

// The planner. A real model returns this as text you parse; the shape is the
// same, which is why a malformed plan is a run-time failure, not a type error.
function plan(history: string[]): Step {
  const seen = history.join(" | ");
  if (!seen.includes("lookup_order")) {
    return { thought: "I need the order before I can judge the claim.", action: "lookup_order", input: "A-1029" };
  }
  if (!seen.includes("refund_policy")) {
    return { thought: "Two charges look duplicate. What does policy allow?", action: "refund_policy", input: "" };
  }
  if (!seen.includes("issue_refund")) {
    return { thought: "Policy covers it in full. Issue the refund.", action: "issue_refund", input: "2500 to A-1029" };
  }
  return { thought: "The refund is done and confirmed.", action: "finish", input: "Refunded 2500 for order A-1029." };
}

const history: string[] = [];
let answer = "(no answer: the loop hit its cap)";

for (let step = 1; step <= MAX_STEPS; step++) {
  const { thought, action, input } = plan(history);
  console.log(`step ${step}`);
  console.log(`  thought      ${thought}`);

  if (action === "finish") {
    answer = input;
    console.log(`  action       finish`);
    break;
  }

  const tool = tools[action];
  if (!tool) {
    // A hallucinated tool name is the single most common agent failure. It is
    // an observation, not a crash: hand it back and let the model recover.
    console.log(`  action       ${action}  <- no such tool`);
    history.push(`${action} -> error: no such tool`);
    continue;
  }

  const observation = tool(input);
  console.log(`  action       ${action}(${JSON.stringify(input)})`);
  console.log(`  observation  ${observation}`);
  history.push(`${action} -> ${observation}`);
}

console.log(`\nanswer: ${answer}`);
console.log(
  `\nThe loop ran ${history.length} tool calls plus a planning call before each one.\n` +
    "Three things in that trace are the whole of agent engineering: the cap that\n" +
    "stops a stuck loop from billing you forever, the observation channel that has\n" +
    "to survive being read back by a model, and issue_refund, which is a write.\n" +
    "The next lesson is about why a write inside a loop the model controls needs a\n" +
    "gate in front of it.",
);

export {};
