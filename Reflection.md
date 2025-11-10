# Reflection

## What Was Hard or Easy? What Went Well?
- **Hard:** This project was genuinely difficult — generating code and structure with AI often led to messy or incomplete results, especially for “one-shot” generations.  
- **Easy / Went Well:** The **initial concept-to-implementation phase** actually went smoother than expected. Most problems came from small mismatches in how the AI interpreted asynchronous behavior (e.g., misunderstanding rejected promises or returning errors as strings).  
- **Lesson Learned:** I should have updated the documentation for implementing concepts earlier to reflect these issues — especially around promise handling — so the AI could generate correct code more consistently.

---

## Mistakes and How to Avoid Them
- I repeatedly made the mistake of **not updating my concept generation documentation** to include clarifications about how to handle promises or context.
- I often got frustrated when AI output was wrong, when I could have instead improved the **context** or **constraints** I provided to the LLM.
- Over time, I learned that **context is everything** — the more scoped and precise my input, the better the LLM performed.
- For debugging, I started narrowing the scope of what I asked ChatGPT, focusing on **specific bugs or sections**, which produced much better results.

---

## Skills Acquired and Skills to Develop
- **Acquired:**
  - Improved **prompt engineering** — I got better at shaping my questions to produce usable output.
  - Gained a stronger understanding of **web app structure** and frontend/backend interaction.
  - Learned to balance human design reasoning with AI-assisted implementation.
- **Still Developing:**
  - Security-related design and implementation — I struggled with these, and in hindsight should’ve gone to **office hours** for clarification.
  - More systematic debugging — sometimes I relied on trial and error rather than tracing the logic carefully.

---

## Use of Context and Agentic Coding Tools
- I primarily used the **Context tool** and **agentic coding tool** during **Assignment 4a**. After that, I stopped using them regularly.
- I ran out of agentic coding credits early, and due to what seemed like an account issue, couldn’t use it again after the monthly reset.
- I also lost **autocomplete** at some point, which made things harder.
- Overall, I didn’t fully leverage these tools throughout the later stages, but early on they were helpful for setting up scaffolding.

---

## Conclusions on the Role of LLMs in Software Development
- **LLMs are excellent assistants**, but they ultimately **mirror the developer’s own level of understanding**.  
  - If you know what you’re doing, they can speed things up tremendously.  
  - If you don’t, they can create the illusion of correctness — until something breaks.
- They’re most effective when:
  1. You use them to **diagnose issues**, not just to “fix” them automatically.  
  2. You **narrow the scope** of your request and **stay engaged** in the reasoning process.  
- The main danger lies in **overreliance without comprehension**. AI can help scaffold solutions, but the real understanding — especially around security, architecture, and state management — still has to come from the human developer.

---
