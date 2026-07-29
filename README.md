# Production-Ready Systems with LLMs and Agents, labs

Companion code for the self-paced course at
**[gazar.dev/courses/llms-and-agents](https://gazar.dev/courses/llms-and-agents)**.

> **These are reference implementations of *patterns*, not a prescribed stack.**
> The course teaches architecture decisions that hold regardless of language or
> vendor. This repo happens to use TypeScript + OpenRouter so the patterns are
> runnable and concrete. Everything that touches a vendor lives behind one file
> (`common/llm.ts`); swap it and the labs still teach the same thing.

## How this repo is organised

**One folder per module, one folder per lesson**, named with the same slugs the
course uses. A lesson at `gazar.dev/courses/llms-and-agents/s01-why-demos-die`
has its code at `modules/01-workflows-and-agents/01-s01-why-demos-die`, so you
never have to translate between the course and the repo.

```
common/llm.ts     the only vendor seam
modules/
  00-start-here/
    01-sh-1-welcome/            reading, README points at the lesson
    ...
  01-workflows-and-agents/
    01-s01-why-demos-die/       runnable companions to the lesson
    02-workflow-vs-agent-who-s-driving/
    ...
    05-s02-code-model-boundary/
    ...
    10-lab-workflow-router/     the lab: starter/ + solution/ + tests
    11-field-guide-workflows-and-agents/
  ...
  07-capstone/
```

Each module's README lists its lessons and its lab.

**Doing this as a live cohort instead?** The same code, regrouped into the
cohort schedule, is at
[`maven-llms-and-agents-6-weeks`](https://github.com/ehsangazar/maven-llms-and-agents-6-weeks)
and [`maven-llms-and-agents-4-weeks`](https://github.com/ehsangazar/maven-llms-and-agents-4-weeks).
This repo is the module-based one, matching the self-paced course.

## Setup

```bash
npm install
cp .env.example .env    # add your OPENROUTER_API_KEY
```

## Running a lesson companion or a lab

Both run the same way:

```bash
npm run lab modules/01-workflows-and-agents/10-lab-workflow-router/starter/index.ts
```

### The tests are the brief

```bash
npm test
```

**These fail on a fresh clone. That is the point.** A lab's test file is its
spec: it describes exactly what your implementation must do, and you are done
when it is green. Read the test before you write any code.

The tests need no API key and make no network calls. Every lab injects its model
access, so the parts worth testing (which route was taken, what happens when a
tier fails, what it cost) are deterministic. If you cannot test your routing
without calling a model, the seam is in the wrong place. That is a lesson, not a
limitation.

## The modules

| Module | Lesson companions | The lab |
|--------|-------------------|---------|
| 0 · [Start here](modules/00-start-here) | setup, what you will build, your goals | none |
| 1 · [Workflows and Agents](modules/01-workflows-and-agents) | [`s01-why-demos-die`](modules/01-workflows-and-agents/01-s01-why-demos-die) · [`s02-code-model-boundary`](modules/01-workflows-and-agents/05-s02-code-model-boundary) | [`lab-workflow-router`](modules/01-workflows-and-agents/10-lab-workflow-router): classify a request and dispatch to the right handler, with schema-validated output |
| 2 · [Context Engineering and Retrieval](modules/02-context-and-retrieval) | [`s03-context-engineering`](modules/02-context-and-retrieval/01-s03-context-engineering) · [`s04-context-pipeline`](modules/02-context-and-retrieval/05-s04-context-pipeline) | [`lab-hybrid-rag`](modules/02-context-and-retrieval/07-lab-hybrid-rag): keyword plus vector, re-ranking, chunking |
| 3 · [Cost, Latency and Reliability](modules/03-cost-latency-reliability) | [`s05-cost-latency-reliability`](modules/03-cost-latency-reliability/01-s05-cost-latency-reliability) · [`s06-budget-failure-map`](modules/03-cost-latency-reliability/03-s06-budget-failure-map) | [`lab-budget-cache-fallback`](modules/03-cost-latency-reliability/05-lab-budget-cache-fallback): per-request budgets, caching, fallback ladders |
| 4 · [Agent Architecture and Security](modules/04-agent-architecture-and-security) | [`s07-agent-architecture`](modules/04-agent-architecture-and-security/01-s07-agent-architecture) · [`s08-securing-agents`](modules/04-agent-architecture-and-security/03-s08-securing-agents) | [`lab-guardrailed-agent`](modules/04-agent-architecture-and-security/07-lab-guardrailed-agent): a guardrailed ReAct agent with tool-approval gates and injection defence |
| 5 · [Evals and Observability](modules/05-evals-and-observability) | [`s09-trajectory-evals`](modules/05-evals-and-observability/01-s09-trajectory-evals) · [`s10-harness-tracing`](modules/05-evals-and-observability/02-s10-harness-tracing) | [`lab-eval-harness`](modules/05-evals-and-observability/04-lab-eval-harness): a trajectory-based eval harness with regression detection |
| 6 · [Shipping It](modules/06-shipping-it) | [`s11-capstone-clinic`](modules/06-shipping-it/01-s11-capstone-clinic) · [`s12-design-review`](modules/06-shipping-it/02-s12-design-review) | [`lab-capstone-integration`](modules/06-shipping-it/04-lab-capstone-integration): integrate labs 1 to 5 behind one entry point, plus the seven-section design document |
| 7 · [Capstone](modules/07-capstone) | seven worked designs, then your own review | none |

## What is scaffolded today

**Module 1 is complete.** Both lesson companions are fully worked and runnable,
and `lab-workflow-router` ships a starter, a worked solution and its full test
suite. It is the reference for how all of this looks in code.

**Labs 2 to 6 are specified, not scaffolded.** Each has a README describing what
you build, and the corresponding course lesson carries the steps, the acceptance
criteria and the code shape. Build them in your own codebase against that spec,
or wait for the starter to land here.

The lesson companions for modules 2 to 6 hold notes and small runnable snippets
rather than complete worked examples.

The course copy says exactly this, and the two are kept in step. If that stops
being true, the course is the thing to fix.
