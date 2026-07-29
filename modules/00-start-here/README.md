# Module 0 · Start here

No code in this module. It sets the target: what you are building, how the labs
work, and the goals you write down before Module 1.

**Set up once, here, so every later module just runs:**

```bash
npm install
cp .env.example .env    # add your OPENROUTER_API_KEY
npm test                # the tests are the brief; they fail on a fresh clone
```

Everything that touches a vendor lives in [`common/llm.ts`](../../common/llm.ts).
Swap that one file and every lab still teaches the same thing.
