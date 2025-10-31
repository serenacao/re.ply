import { assertEquals, assertStringIncludes, assertRejects } from "jsr:@std/assert";
import GeneratorConcept, { File } from "./GeneratorConcept.ts";
import { GeminiLLM } from "../../../gemini-llm.ts";

const resume1 = `
Alice Smith
Software Engineer — 3 years experience at TechCorp
alice.smith@email.com
 · (555) 012-3456 · San Francisco, CA · linkedin.com/in/alice-smith
`;

const resume2 = `
Bob Lee
Data Scientist — 5 years experience at DataWorks
`;

const resume3 = `
Carol Chen
Product Manager — 4 years experience at InnovateX
`;

Deno.test("Generator Concept Tests", async (test) => {
  await test.step("generate: should produce a reasonable draft for a simple question", async () => {
    const files: File[] = [
      { name: "resume.txt", content: resume1 },
      { name: "coverletter.txt", content: "Dear Hiring Manager,\nI am excited to apply for " },
    ];
    const question = "Write a cover letter for Microsoft software dev.";
    const llm = new GeminiLLM();
    const generator = new GeneratorConcept(llm);

    const draft = await generator.generate({question, files});
    console.log("\n📝 Generated Draft:\n", draft);
    assertStringIncludes(draft.draft, "Microsoft");
  });

  await test.step("feedback: should revise the generated draft when given feedback", async () => {
    const files: File[] = [{ name: "resume.txt", content: resume2 }];
    const question = "Draft a LinkedIn summary.";
    const llm = new GeminiLLM();
    const generator = new GeneratorConcept(llm);

    let draft = await generator.generate({question, files});
    console.log("\n📝 Initial Draft:\n", draft);

    const feedback = "Make it more concise and highlight leadership.";
    draft = await generator.feedback({comment: feedback});
    console.log("\n📝 Revised Draft:\n", draft);

    assertStringIncludes(draft.draft, "leadership");
  });

  await test.step("edit: should record and apply user edits to the draft", async () => {
    const files: File[] = [{ name: "resume.txt", content: resume3 }];
    const question =
      "Write in 250 words or less why you would be a good fit for software engineer at Microsoft.";
    const llm = new GeminiLLM();
    const generator = new GeneratorConcept(llm);

    const draft = await generator.generate({question, files});
    console.log("\n📝 Initial Draft:\n", draft);

    const userEdit =
      draft + "\nI am passionate about user experience and cross-functional teamwork.";
    await generator.edit({newDraft: userEdit});

    // (Optional) verify internal state if your concept tracks edits
    console.log("\n✏️ User Edited Draft Recorded Successfully");
  });

  await test.step("generate: should reject overly complex or long prompts", async () => {
    const files: File[] = [{ name: "resume.txt", content: resume1 }];
    const question =
      "gjiwaoegjiog;nawoeklgdas;fjoiaewkl";
    const llm = new GeminiLLM();
    const generator = new GeneratorConcept(llm);

    await assertRejects(
      () => generator.generate({question, files}),
      Error,
      undefined,
      "The input is not a valid question.",
    );
  });

  await test.step("feedback: should throw an error for nonsensical feedback", async () => {
    const files: File[] = [{ name: "resume.txt", content: resume2 }];
    const question = "Draft a LinkedIn summary.";
    const llm = new GeminiLLM();
    const generator = new GeneratorConcept(llm);

    await generator.generate({question, files});
    await assertRejects(
      () => generator.feedback({comment: "32."}), // invalid feedback
      Error,
      undefined,
      "Should throw on nonsensical feedback",
    );
  });

  await test.step("end-to-end: should handle generation, feedback, edit in one flow", async () => {
    const files: File[] = [{ name: "resume.txt", content: resume1 }];
    const question = "Write a short bio for an engineering portfolio.";
    const llm = new GeminiLLM();
    const generator = new GeneratorConcept(llm);

    let draft = await generator.generate({question, files});
    assertStringIncludes(draft.draft, "Engineer", 'draft doesnt container engineer');

    const feedback = "Add more details about leadership and innovation.";
    draft = await generator.feedback({comment: feedback});
    console.log("\n📝 Revised:\n", draft);

    const userEdit = draft + "\nI value collaboration across teams.";
    await generator.edit({newDraft: userEdit});
    
  });
});
