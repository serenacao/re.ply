---
timestamp: 'Thu Oct 30 2025 12:32:53 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251030_123253.541c0a3e.md]]'
content_id: 14835bd4684cc29d7aed3d0ad253eaf92bc979e0f2bb76f1b21e43cc1edae5c0
---

# file: src/concepts/Generator/GeneratorConcept.test.ts

```typescript
import { assertEquals, assertRejects, assertNotEquals } from "jsr:@std/assert";
import GeneratorConcept, { ILLM, File } from "@concepts/Generator/GeneratorConcept.ts";
import { testDb } from "@utils/database.ts"; // Keeping this import as per instruction, though not strictly used by in-memory GeneratorConcept.

// --- Mock LLM Implementation ---
class MockLLM implements ILLM {
    private responses: Map<string, string>;
    private defaultResponse: string;

    constructor(defaultResponse: string = "Mocked LLM response") {
        this.responses = new Map();
        this.defaultResponse = defaultResponse;
    }

    setResponse(promptPart: string, response: string) {
        this.responses.set(promptPart, response);
    }

    async executeLLM(prompt: string): Promise<string> {
        // console.log(`--- MockLLM received prompt part: ${prompt.substring(0, 100)}... ---`); // Debugging
        for (const [key, value] of this.responses.entries()) {
            if (prompt.includes(key)) {
                // console.log(`MockLLM matching key: ${key}, returning: ${value}`); // Debugging
                return Promise.resolve(value);
            }
        }
        // console.log(`MockLLM no match, returning default: ${this.defaultResponse}`); // Debugging
        return Promise.resolve(this.defaultResponse);
    }
}

// --- Test Suite for GeneratorConcept ---
Deno.test("GeneratorConcept", async (t) => {
    // Setup for database, even if GeneratorConcept is in-memory
    // This adheres to the instruction "While testing, use the testDb function"
    const [db, client] = await testDb();
    console.log("Database initialized for testing (Note: GeneratorConcept is in-memory).");

    // Mock files for testing
    const resumeFile: File = { name: "resume.pdf", content: "Experience: Software Engineer at ExampleCo." };
    const coverLetterFile: File = { name: "cover_letter_template.docx", content: "Dear [Hiring Manager]," };

    // --- Action: updateInput ---
    await t.step("updateInput: updates the current files for concept", () => {
        console.log("\n--- Testing updateInput ---");
        const mockLLM = new MockLLM();
        const generator = new GeneratorConcept(mockLLM);
        console.log(`Initial files: ${JSON.stringify(generator.getCurrentFiles())}`);
        generator.updateInput([resumeFile]);
        assertEquals(generator.getCurrentFiles(), [resumeFile], "Files should be updated.");
        console.log(`Files after updateInput: ${JSON.stringify(generator.getCurrentFiles())}`);
    });

    // --- Action: generate ---
    await t.step("generate: successfully creates a new draft", async () => {
        console.log("\n--- Testing generate (success) ---");
        const mockLLM = new MockLLM();
        mockLLM.setResponse("is a valid question", "Yes"); // Mock for isQuestion
        mockLLM.setResponse("User question: \"Write a cover letter\"", "Generated cover letter draft.");
        const generator = new GeneratorConcept(mockLLM);

        const question = "Write a cover letter for a software engineer role.";
        console.log(`Attempting to generate for question: "${question}"`);
        const result = await generator.generate(question, mockLLM, [resumeFile, coverLetterFile]);

        assertEquals(result, { draft: "Generated cover letter draft." }, "Should return the generated draft.");
        assertEquals(generator.getQuestion(), question, "Concept's question state should be set.");
        assertEquals(generator.getDraft(), "Generated cover letter draft.", "Concept's draft state should be set.");
        assertEquals(generator.isAccepted(), false, "Draft should not be accepted.");
        assertEquals(generator.getFeedbackHistory().length, 0, "Feedback history should be empty.");
        assertEquals(generator.getCurrentFiles(), [resumeFile, coverLetterFile], "Files should be set.");
        console.log(`Generated draft: "${generator.getDraft()}"`);
        console.log(`Is accepted: ${generator.isAccepted()}`);
    });

    await t.step("generate: rejects if question is invalid", async () => {
        console.log("\n--- Testing generate (invalid question) ---");
        const mockLLM = new MockLLM();
        mockLLM.setResponse("is a valid question", "No"); // Mock for isQuestion
        const generator = new GeneratorConcept(mockLLM);

        console.log(`Attempting to generate for invalid question.`);
        await assertRejects(
            () => generator.generate("What is 1+1?", mockLLM, []),
            Error,
            "The input is not a valid question.",
            "Should reject for an invalid question."
        );
        assertEquals(generator.getDraft(), "", "Draft should remain empty if generation fails.");
        console.log("Generation successfully rejected for invalid question.");
    });

    await t.step("generate: rejects if draft is already accepted", async () => {
        console.log("\n--- Testing generate (already accepted) ---");
        const mockLLM = new MockLLM();
        mockLLM.setResponse("is a valid question", "Yes");
        mockLLM.setResponse("User question: \"Initial question\"", "Initial draft.");
        const generator = new GeneratorConcept(mockLLM);

        await generator.generate("Initial question", mockLLM, []);
        generator.accept(); // Accept the draft

        console.log(`Attempting to generate new draft after current one is accepted.`);
        await assertRejects(
            () => generator.generate("New question", mockLLM, []),
            Error,
            "Cannot generate new draft after current draft has been accepted.",
            "Should reject if attempting to generate after accepted."
        );
        console.log("Generation successfully rejected for accepted draft.");
    });

    // --- Action: accept ---
    await t.step("accept: successfully accepts a draft", () => {
        console.log("\n--- Testing accept (success) ---");
        const mockLLM = new MockLLM();
        mockLLM.setResponse("is a valid question", "Yes");
        mockLLM.setResponse("User question: \"Draft to accept\"", "Draft content to be accepted.");
        const generator = new GeneratorConcept(mockLLM);

        generator.generate("Draft to accept", mockLLM, []); // Generate a draft
        console.log(`Current accepted status: ${generator.isAccepted()}`);

        const result = generator.accept();
        assertEquals(result, { draft: "Draft content to be accepted." }, "Should return the accepted draft content.");
        assertEquals(generator.isAccepted(), true, "Draft should be marked as accepted.");
        console.log(`Draft accepted. Is accepted: ${generator.isAccepted()}`);
    });

    await t.step("accept: rejects if no draft exists", async () => {
        console.log("\n--- Testing accept (no draft) ---");
        const mockLLM = new MockLLM();
        const generator = new GeneratorConcept(mockLLM);

        console.log(`Attempting to accept when no draft exists.`);
        await assertRejects(
            () => generator.accept(),
            Error,
            "No question or draft exists to accept.",
            "Should reject if no draft exists."
        );
        console.log("Accept successfully rejected for no draft.");
    });

    await t.step("accept: rejects if draft is already accepted", async () => {
        console.log("\n--- Testing accept (already accepted) ---");
        const mockLLM = new MockLLM();
        mockLLM.setResponse("is a valid question", "Yes");
        mockLLM.setResponse("User question: \"Another draft\"", "Another draft content.");
        const generator = new GeneratorConcept(mockLLM);

        await generator.generate("Another draft", mockLLM, []);
        generator.accept(); // First accept
        console.log(`Current accepted status: ${generator.isAccepted()}`);

        console.log(`Attempting to accept again.`);
        await assertRejects(
            () => generator.accept(),
            Error,
            "Draft is already accepted.",
            "Should reject if already accepted."
        );
        console.log("Accept successfully rejected for already accepted draft.");
    });

    // --- Action: edit ---
    await t.step("edit: successfully updates the draft and logs inferred feedback", async () => {
        console.log("\n--- Testing edit (success) ---");
        const mockLLM = new MockLLM();
        mockLLM.setResponse("is a valid question", "Yes");
        mockLLM.setResponse("User question: \"Draft to edit\"", "Original draft content.");
        mockLLM.setResponse("You are an assistant that analyzes revisions to writing.", '["Simplified language", "Improved clarity"]'); // Mock for updateFeedbackFromEdit
        const generator = new GeneratorConcept(mockLLM);

        await generator.generate("Draft to edit", mockLLM, []);
        const originalDraft = generator.getDraft();
        const newDraft = "Revised draft content.";
        console.log(`Original draft: "${originalDraft}"`);
        console.log(`Editing to: "${newDraft}"`);

        const result = await generator.edit(mockLLM, newDraft);
        assertEquals(result, { draft: newDraft }, "Should return the new draft.");
        assertEquals(generator.getDraft(), newDraft, "Draft should be updated to newDraft.");
        assertEquals(generator.getFeedbackHistory().length, 2, "Feedback history should include inferred feedback.");
        assertEquals(generator.getFeedbackHistory()[0], "Simplified language", "First inferred feedback should be correct.");
        console.log(`Draft after edit: "${generator.getDraft()}"`);
        console.log(`Feedback history after edit: ${JSON.stringify(generator.getFeedbackHistory())}`);
    });

    await t.step("edit: rejects if no draft exists", async () => {
        console.log("\n--- Testing edit (no draft) ---");
        const mockLLM = new MockLLM();
        const generator = new GeneratorConcept(mockLLM);

        console.log(`Attempting to edit when no draft exists.`);
        await assertRejects(
            () => generator.edit(mockLLM, "Some new text"),
            Error,
            "No draft exists to edit.",
            "Should reject if no draft exists."
        );
        console.log("Edit successfully rejected for no draft.");
    });

    await t.step("edit: rejects if draft is accepted", async () => {
        console.log("\n--- Testing edit (accepted draft) ---");
        const mockLLM = new MockLLM();
        mockLLM.setResponse("is a valid question", "Yes");
        mockLLM.setResponse("User question: \"Accepted draft\"", "Accepted content.");
        const generator = new GeneratorConcept(mockLLM);

        await generator.generate("Accepted draft", mockLLM, []);
        generator.accept();
        console.log(`Current accepted status: ${generator.isAccepted()}`);

        console.log(`Attempting to edit an accepted draft.`);
        await assertRejects(
            () => generator.edit(mockLLM, "Trying to edit accepted"),
            Error,
            "Cannot edit an accepted draft.",
            "Should reject editing an accepted draft."
        );
        console.log("Edit successfully rejected for accepted draft.");
    });

    // --- Action: feedback ---
    await t.step("feedback: successfully adds feedback and regenerates draft", async () => {
        console.log("\n--- Testing feedback (success) ---");
        const mockLLM = new MockLLM();
        mockLLM.setResponse("is a valid question", "Yes");
        mockLLM.setResponse("User question: \"Draft for feedback\"", "Initial draft.");
        mockLLM.setResponse("is a message giving feedback", "Yes"); // Mock for isFeedback
        mockLLM.setResponse("The user has provided the following feedback on the draft:", "Revised draft with feedback."); // Mock for regenerateWithFeedback
        const generator = new GeneratorConcept(mockLLM);

        await generator.generate("Draft for feedback", mockLLM, []);
        const initialDraft = generator.getDraft();
        const userFeedback = "Make it more concise.";
        console.log(`Initial draft: "${initialDraft}"`);
        console.log(`Providing feedback: "${userFeedback}"`);

        const result = await generator.feedback(mockLLM, userFeedback);
        assertEquals(result, { draft: "Revised draft with feedback." }, "Should return the revised draft.");
        assertEquals(generator.getDraft(), "Revised draft with feedback.", "Draft should be updated by feedback.");
        assertEquals(generator.getFeedbackHistory().length, 1, "Feedback history should include the new feedback.");
        assertEquals(generator.getFeedbackHistory()[0], userFeedback, "Feedback should be recorded correctly.");
        assertNotEquals(generator.getDraft(), initialDraft, "Draft content should have changed.");
        console.log(`Draft after feedback: "${generator.getDraft()}"`);
        console.log(`Feedback history after feedback: ${JSON.stringify(generator.getFeedbackHistory())}`);
    });

    await t.step("feedback: rejects if feedback is invalid", async () => {
        console.log("\n--- Testing feedback (invalid feedback) ---");
        const mockLLM = new MockLLM();
        mockLLM.setResponse("is a valid question", "Yes");
        mockLLM.setResponse("User question: \"Draft for invalid feedback\"", "Some draft.");
        mockLLM.setResponse("is a message giving feedback", "No"); // Mock for isFeedback
        const generator = new GeneratorConcept(mockLLM);

        await generator.generate("Draft for invalid feedback", mockLLM, []);
        console.log(`Attempting to provide invalid feedback.`);
        await assertRejects(
            () => generator.feedback(mockLLM, "What's the weather like?"),
            Error,
            "Please submit valid actionable feedback.",
            "Should reject for invalid feedback."
        );
        assertEquals(generator.getFeedbackHistory().length, 0, "Feedback history should not include invalid feedback.");
        console.log("Feedback successfully rejected for invalid feedback.");
    });

    await t.step("feedback: rejects if no draft exists", async () => {
        console.log("\n--- Testing feedback (no draft) ---");
        const mockLLM = new MockLLM();
        const generator = new GeneratorConcept(mockLLM);

        console.log(`Attempting to provide feedback when no draft exists.`);
        await assertRejects(
            () => generator.feedback(mockLLM, "Improve this!"),
            Error,
            "No draft exists to provide feedback on.",
            "Should reject if no draft exists."
        );
        console.log("Feedback successfully rejected for no draft.");
    });

    await t.step("feedback: rejects if draft is accepted", async () => {
        console.log("\n--- Testing feedback (accepted draft) ---");
        const mockLLM = new MockLLM();
        mockLLM.setResponse("is a valid question", "Yes");
        mockLLM.setResponse("User question: \"Accepted for feedback\"", "Final accepted draft.");
        const generator = new GeneratorConcept(mockLLM);

        await generator.generate("Accepted for feedback", mockLLM, []);
        generator.accept();
        console.log(`Current accepted status: ${generator.isAccepted()}`);

        console.log(`Attempting to provide feedback on an accepted draft.`);
        await assertRejects(
            () => generator.feedback(mockLLM, "Make it better"),
            Error,
            "Cannot provide feedback on an accepted draft.",
            "Should reject feedback on an accepted draft."
        );
        console.log("Feedback successfully rejected for accepted draft.");
    });

    // --- Principle Fulfillment Trace ---
    await t.step("Principle Trace: demonstrates interactive generation, feedback, edit, and acceptance workflow", async () => {
        console.log("\n--- Principle Fulfillment Trace ---");
        const mockLLM = new MockLLM();

        // Configure mock LLM for the trace steps
        mockLLM.setResponse("is a valid question", "Yes");
        mockLLM.setResponse("is a message giving feedback", "Yes");
        mockLLM.setResponse("You are an assistant that analyzes revisions to writing.", '["Fixed typos"]'); // For edit feedback

        // Step 1: LLM generates an answer to the question
        mockLLM.setResponse("User question: \"Generate a LinkedIn summary\"", "Draft 1: A brief and professional summary for LinkedIn.");
        const generator = new GeneratorConcept(mockLLM);
        const files: File[] = [{ name: "skills.txt", content: "TypeScript, Deno, MongoDB" }];

        console.log("Trace Step 1: Generating initial draft.");
        const generateResult = await generator.generate("Generate a LinkedIn summary emphasizing my tech skills.", mockLLM, files);
        assertEquals(generateResult.draft, "Draft 1: A brief and professional summary for LinkedIn.");
        assertEquals(generator.getDraft(), "Draft 1: A brief and professional summary for LinkedIn.");
        assertEquals(generator.isAccepted(), false);
        assertEquals(generator.getFeedbackHistory().length, 0);
        console.log(`Initial Draft: "${generator.getDraft()}"`);

        // Step 2: User provides feedback, and it regenerates its output
        const feedback1 = "Make it more specific about Deno.";
        mockLLM.setResponse(`The user has provided the following feedback on the draft:\n1. ${feedback1}\nPlease revise the following draft accordingly.`, "Draft 2: A professional summary highlighting Deno and TypeScript skills.");
        console.log("\nTrace Step 2: Providing feedback and regenerating.");
        const feedbackResult = await generator.feedback(mockLLM, feedback1);
        assertEquals(feedbackResult.draft, "Draft 2: A professional summary highlighting Deno and TypeScript skills.");
        assertEquals(generator.getDraft(), "Draft 2: A professional summary highlighting Deno and TypeScript skills.");
        assertEquals(generator.getFeedbackHistory().length, 1);
        assertEquals(generator.getFeedbackHistory()[0], feedback1);
        console.log(`Draft after feedback: "${generator.getDraft()}"`);

        // Step 3: User edits it (manual refinement)
        const newDraftAfterEdit = "Draft 3: An expert in Deno and TypeScript, building robust applications.";
        console.log("\nTrace Step 3: Editing the draft manually.");
        const editResult = await generator.edit(mockLLM, newDraftAfterEdit);
        assertEquals(editResult.draft, newDraftAfterEdit);
        assertEquals(generator.getDraft(), newDraftAfterEdit);
        assertEquals(generator.getFeedbackHistory().length, 2); // Includes inferred feedback from edit
        assertEquals(generator.getFeedbackHistory()[1], "Fixed typos"); // Inferred feedback
        console.log(`Draft after edit: "${generator.getDraft()}"`);
        console.log(`Feedback history after edit: ${JSON.stringify(generator.getFeedbackHistory())}`);

        // Step 4: User accepts it
        console.log("\nTrace Step 4: Accepting the final draft.");
        const acceptResult = generator.accept();
        assertEquals(acceptResult.draft, newDraftAfterEdit);
        assertEquals(generator.isAccepted(), true);
        console.log(`Final Accepted Draft: "${generator.getDraft()}"`);
        console.log(`Is Accepted: ${generator.isAccepted()}`);

        // Step 5: Attempt to provide further feedback or edits (should be rejected)
        console.log("\nTrace Step 5: Attempting further actions on accepted draft (should fail).");
        await assertRejects(
            () => generator.feedback(mockLLM, "Improve this more."),
            Error,
            "Cannot provide feedback on an accepted draft.",
            "Feedback on accepted draft should be rejected."
        );
        await assertRejects(
            () => generator.edit(mockLLM, "New edit on accepted."),
            Error,
            "Cannot edit an accepted draft.",
            "Edit on accepted draft should be rejected."
        );
        console.log("Successfully prevented modifications to an accepted draft.");
        console.log("Principle fulfillment trace completed successfully, demonstrating the intended workflow.");
    });

    // Close the database client after all tests in this suite
    await client.close();
    console.log("Database client closed.");
});
```
