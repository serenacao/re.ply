---
timestamp: 'Wed Oct 29 2025 23:47:08 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251029_234708.11fc19fb.md]]'
content_id: 9a283eb3ca6da26cbfd015506b7ae3d138164f6e5e3e8381e2bb48946743f6f3
---

# file: src/concepts/GeneratorConcept.test.ts

```typescript
import { assertEquals, assertNotEquals, assertArrayIncludes } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import GeneratorConcept from "./GeneratorConcept.ts"; // Import the re-implemented concept
import { GeminiLLM } from '../gemini-llm.ts'; // Assuming GeminiLLM is in a specific location
import { File } from './GeneratorConcept.ts'; // Import File interface from the concept

// Mock GeminiLLM for deterministic testing
class MockGeminiLLM implements GeminiLLM {
    private responses: Map<string, string>;
    private feedbackInferences: Map<string, string[]>;

    constructor() {
        this.responses = new Map();
        this.feedbackInferences = new Map();
    }

    setResponse(promptPart: string, response: string) {
        this.responses.set(promptPart, response);
    }

    setFeedbackInference(oldDraft: string, newDraft: string, inferredFeedback: string[]) {
        // Use a more robust key if `oldDraft` or `newDraft` can be very long
        this.feedbackInferences.set(`${oldDraft} --- ${newDraft}`, inferredFeedback);
    }

    async executeLLM(prompt: string): Promise<string> {
        // console.log("LLM Prompt:", prompt); // For debugging mocks
        for (const [key, value] of this.responses.entries()) {
            if (prompt.includes(key)) {
                return Promise.resolve(value);
            }
        }

        // Handle specific cases like feedback inference for `updateFeedbackFromEdit`
        if (prompt.includes("You are an assistant that analyzes revisions to writing.")) {
            const oldDraftMatch = prompt.match(/Draft A:\s*\n([\s\S]*?)\n\nDraft B:/);
            const newDraftMatch = prompt.match(/Draft B:\s*\n([\s\S]*?)\n\nOutput:/);
            if (oldDraftMatch && newDraftMatch && oldDraftMatch[1] && newDraftMatch[1]) {
                const oldDraft = oldDraftMatch[1].trim();
                const newDraft = newDraftMatch[1].trim();
                const inferred = this.feedbackInferences.get(`${oldDraft} --- ${newDraft}`);
                if (inferred) {
                    return Promise.resolve(JSON.stringify(inferred));
                }
            }
        }

        console.warn(`No specific mock response found for prompt part: ${prompt.substring(0, Math.min(prompt.length, 100))}... Using default.`);
        return Promise.resolve("Mocked LLM default response.");
    }
}

Deno.test("Generator Concept Tests", async (t) => {
    let mockLLM: MockGeminiLLM;
    let generatorConcept: GeneratorConcept;
    const testFiles: File[] = [{ name: "resume.txt", content: "John Doe, Software Engineer. Experienced in TypeScript." }];
    const testQuestion = "Write a LinkedIn summary for a software engineer based on the provided resume.";

    // Use testDb for proper concept testing with MongoDB, which provides a clean DB for each test file
    const [db, client] = await testDb();

    t.beforeEach(async () => {
        // Clear collections before each test step to ensure test isolation
        await db.collection("Generator.questions").deleteMany({});
        await db.collection("Generator.feedbackHistory").deleteMany({});

        mockLLM = new MockGeminiLLM();
        generatorConcept = new GeneratorConcept(db);

        // Setup common LLM responses for classifiers (isQuestion, isFeedback)
        // These mocks are for the internal `isQuestion` and `isFeedback` checks within the concept
        mockLLM.setResponse('Determine if the input is a message asking for help writing or improving materials related to a job', 'Yes');
        mockLLM.setResponse('Determine if the input is a message giving feedback or instructions about how to improve a piece of writing', 'Yes');
        // Specific mocks for invalid inputs
        mockLLM.setResponse('Input: "What is the capital of France?"\n        Answer:', 'No'); // Specific mock for invalid question
        mockLLM.setResponse('Input: "Just kidding, write about cats."\n\n        Answer:', 'No'); // Specific mock for invalid feedback
    });

    t.afterAll(async () => {
        // Ensure the MongoDB client is closed after all tests in this file complete
        await client.close();
    });

    await t.step("Action: generate (initial generation for valid question)", async () => {
        console.log("\n--- Testing 'generate' action: initial generation ---");

        // Mock LLM response for the initial draft generation
        mockLLM.setResponse(`User question: "${testQuestion}"`, "Initial draft for LinkedIn summary.");

        console.log(`Input: Question="${testQuestion}", Files=${JSON.stringify(testFiles.map(f => f.name))}`);
        const result = await generatorConcept.generate({ question: testQuestion, llm: mockLLM, files: testFiles });
        console.log(`Output: Generated Draft="${result.draft}"`);

        assertEquals(result.error, undefined, "Action: 'generate' should not return an error for valid input.");
        assertEquals(result.draft, "Initial draft for LinkedIn summary.", "Effect: Should generate the initial draft content.");

        // Verify state via queries (as per concept design guidelines for observing effects)
        const draftQuery = await generatorConcept._getDraft();
        assertEquals(draftQuery.length, 1, "Query: Should return exactly one draft.");
        assertEquals(draftQuery[0].draft, "Initial draft for LinkedIn summary.", "Effect: Internal draft state should be updated.");

        const acceptedQuery = await generatorConcept._getAcceptedStatus();
        assertEquals(acceptedQuery.length, 1, "Query: Should return accepted status.");
        assertEquals(acceptedQuery[0].accepted, false, "Effect: Accepted flag should be false after generation.");

        const feedbackHistoryQuery = await generatorConcept._getFeedbackHistory();
        assertEquals(feedbackHistoryQuery.length, 0, "Effect: Feedback history should be empty initially.");

        const questionTextQuery = await generatorConcept._getQuestionText();
        assertEquals(questionTextQuery.length, 1, "Query: Should return question text.");
        assertEquals(questionTextQuery[0].question, testQuestion, "Effect: Question text should be stored.");

        console.log("Verification: Initial draft generated, state updated, accepted flag false, question stored.");
    });

    await t.step("Action: generate (invalid question - precondition failure)", async () => {
        console.log("\n--- Testing 'generate' action: invalid question ---");
        const invalidQuestion = "What is the capital of France?";
        // Mocking `isQuestion` to return false for this specific input is handled in `t.beforeEach`

        console.log(`Input: Invalid Question="${invalidQuestion}"`);
        const result = await generatorConcept.generate({ question: invalidQuestion, llm: mockLLM, files: [] });
        console.log(`Output: Error="${result.error}"`);

        assertEquals(result.error, 'The input is not a valid question for generation.', "Requires: Should return an error for an invalid question.");
        assertEquals(result.draft, undefined, "Effect: Should not return a draft on precondition failure.");

        // Verify state remains empty or unchanged
        const draftQuery = await generatorConcept._getDraft();
        assertEquals(draftQuery.length, 1, "Query: Should return a query result (error).");
        assertEquals(draftQuery[0].error, 'No active question found.', "Effect: No question document should be created.");

        console.log("Verification: No draft generated for invalid question, internal state unchanged (empty).");
    });

    await t.step("Action: accept", async () => {
        console.log("\n--- Testing 'accept' action ---");
        // Pre-requisite: Generate a draft to set up the state for 'accept'
        mockLLM.setResponse(`User question: "${testQuestion}"`, "Draft to be accepted.");
        await generatorConcept.generate({ question: testQuestion, llm: mockLLM, files: testFiles });

        const initialDraft = (await generatorConcept._getDraft())[0].draft;
        const initialAccepted = (await generatorConcept._getAcceptedStatus())[0].accepted;
        console.log(`Pre-condition state: Draft="${initialDraft}", Accepted=${initialAccepted}`);

        const result = await generatorConcept.accept();
        console.log(`Output: Result="${JSON.stringify(result)}", Accepted=${(await generatorConcept._getAcceptedStatus())[0].accepted}`);

        assertEquals(result.error, undefined, "Action: 'accept' should not return an error.");
        assertEquals(Object.keys(result).length, 0, "Effect: Should return an empty object for success.");

        // Verify state via queries
        const acceptedQuery = await generatorConcept._getAcceptedStatus();
        assertEquals(acceptedQuery[0].accepted, true, "Effect: Accepted flag should be true after calling accept.");
        console.log("Verification: Accepted flag set to true.");
    });

    await t.step("Action: edit (unaccepted draft)", async () => {
        console.log("\n--- Testing 'edit' action ---");
        // Pre-requisite: Generate an initial draft that is not accepted
        mockLLM.setResponse(`User question: "${testQuestion}"`, "Original draft.");
        await generatorConcept.generate({ question: testQuestion, llm: mockLLM, files: testFiles });

        const initialAccepted = (await generatorConcept._getAcceptedStatus())[0].accepted;
        assertEquals(initialAccepted, false, "Pre-condition: Draft should not be accepted.");
        const oldDraft = (await generatorConcept._getDraft())[0].draft;
        assertEquals(oldDraft, "Original draft.", "Pre-condition: Draft should be the original.");
        const initialFeedbackHistory = await generatorConcept._getFeedbackHistory();
        assertEquals(initialFeedbackHistory.length, 0, "Pre-condition: Feedback history should be empty.");

        const newDraft = "Revised draft with more detail, edited by user.";
        console.log(`Input: Old Draft="${oldDraft}", New Draft="${newDraft}"`);

        // Mock LLM feedback inference for the `updateFeedbackFromEdit` call within `edit`
        mockLLM.setFeedbackInference(oldDraft!, newDraft, ["Add more detail."]);

        const result = await generatorConcept.edit({ llm: mockLLM, newDraft });
        console.log(`Output: Result="${JSON.stringify(result)}"`);

        assertEquals(result.error, undefined, "Action: 'edit' should not return an error.");
        assertEquals(Object.keys(result).length, 0, "Effect: Should return an empty object for success.");

        // Verify state via queries
        const updatedDraft = (await generatorConcept._getDraft())[0].draft;
        assertEquals(updatedDraft, newDraft, "Effect: Draft should be updated to newDraft.");
        const updatedFeedbackHistory = await generatorConcept._getFeedbackHistory();
        assertArrayIncludes(updatedFeedbackHistory.map(f => f.feedback), ["Add more detail."], "Effect: Feedback history should include inferred feedback.");
        assertEquals(updatedFeedbackHistory.length, 1, "Effect: Feedback history should contain 1 entry after edit.");
        console.log("Verification: Draft updated, feedback inferred and added to history.");
    });

    await t.step("Action: feedback (valid feedback)", async () => {
        console.log("\n--- Testing 'feedback' action: valid feedback ---");
        // Pre-requisite: Generate an initial draft that is not accepted
        mockLLM.setResponse(`User question: "${testQuestion}"`, "Initial draft for feedback.");
        await generatorConcept.generate({ question: testQuestion, llm: mockLLM, files: testFiles });

        const initialAccepted = (await generatorConcept._getAcceptedStatus())[0].accepted;
        assertEquals(initialAccepted, false, "Pre-condition: Draft should not be accepted.");
        const initialFeedbackHistory = await generatorConcept._getFeedbackHistory();
        assertEquals(initialFeedbackHistory.length, 0, "Pre-condition: Feedback history should be empty.");

        const userFeedback = "Make it more concise.";
        // Mock LLM for draft regeneration based on feedback
        mockLLM.setResponse(`The user has provided the following feedback on the draft:\n1. ${userFeedback}`, "Revised draft after feedback.");

        console.log(`Input: Current Draft="${(await generatorConcept._getDraft())[0].draft}", Feedback="${userFeedback}"`);
        const result = await generatorConcept.feedback({ llm: mockLLM, feedback: userFeedback });
        console.log(`Output: Result Draft="${result.draft}"`);

        assertEquals(result.error, undefined, "Action: 'feedback' should not return an error for valid input.");
        assertEquals(result.draft, "Revised draft after feedback.", "Effect: Should regenerate draft based on feedback.");

        // Verify state via queries
        const updatedDraft = (await generatorConcept._getDraft())[0].draft;
        assertEquals(updatedDraft, "Revised draft after feedback.", "Effect: Internal draft state should be updated.");
        const updatedFeedbackHistory = await generatorConcept._getFeedbackHistory();
        assertArrayIncludes(updatedFeedbackHistory.map(f => f.feedback), [userFeedback], "Effect: Feedback should be added to history.");
        assertEquals(updatedFeedbackHistory.length, 1, "Effect: Feedback history should contain 1 entry.");
        console.log("Verification: Draft regenerated, feedback added to history.");
    });

    await t.step("Action: feedback (invalid feedback - precondition failure)", async () => {
        console.log("\n--- Testing 'feedback' action: invalid feedback ---");
        // Pre-requisite: Generate an initial draft
        mockLLM.setResponse(`User question: "${testQuestion}"`, "Initial draft for invalid feedback test.");
        await generatorConcept.generate({ question: testQuestion, llm: mockLLM, files: testFiles });
        const originalDraft = (await generatorConcept._getDraft())[0].draft;
        const initialFeedbackCount = (await generatorConcept._getFeedbackHistory()).length;

        const invalidFeedback = "Just kidding, write about cats.";
        // Mocking `isFeedback` to return false for this specific input is handled in `t.beforeEach`

        console.log(`Input: Current Draft="${originalDraft}", Invalid Feedback="${invalidFeedback}"`);
        const result = await generatorConcept.feedback({ llm: mockLLM, feedback: invalidFeedback });
        console.log(`Output: Error="${result.error}"`);

        assertEquals(result.error, 'Invalid or unactionable feedback provided.', "Requires: Should return an error for invalid feedback.");
        assertEquals(result.draft, undefined, "Effect: Should not return a draft on precondition failure.");

        // Verify state remains unchanged
        const currentDraft = (await generatorConcept._getDraft())[0].draft;
        assertEquals(currentDraft, originalDraft, "Effect: Draft should not change for invalid feedback.");
        const currentFeedbackCount = (await generatorConcept._getFeedbackHistory()).length;
        assertEquals(currentFeedbackCount, initialFeedbackCount, "Effect: Feedback history should not include invalid feedback.");
        console.log("Verification: No changes for invalid feedback, internal state unchanged.");
    });

    await t.step("Principle Fulfillment Trace: Generate -> Feedback -> Edit -> Accept", async () => {
        console.log("\n--- Principle Fulfillment Trace ---");
        // Clear collections for a clean trace from scratch
        await db.collection("Generator.questions").deleteMany({});
        await db.collection("Generator.feedbackHistory").deleteMany({});
        console.log("Trace Start: GeneratorConcept collections cleared for new trace.");

        // 1. Generate an initial draft
        mockLLM.setResponse(`User question: "${testQuestion}"`, "Initial draft generated by LLM.");
        console.log(`Step 1: Generating initial draft for question: "${testQuestion}"`);
        let generateResult = await generatorConcept.generate({ question: testQuestion, llm: mockLLM, files: testFiles });
        console.log(`  Initial Draft: "${generateResult.draft}"`);
        assertEquals(generateResult.draft, "Initial draft generated by LLM.", "Trace: Initial draft should be correct.");
        assertEquals((await generatorConcept._getAcceptedStatus())[0].accepted, false, "Trace: Not accepted yet.");
        assertEquals((await generatorConcept._getFeedbackHistory()).length, 0, "Trace: No feedback yet.");
        console.log("Step 1 Complete.");

        // 2. Provide feedback, LLM regenerates
        const feedback1 = "Make it sound more confident and professional.";
        mockLLM.setResponse(`The user has provided the following feedback on the draft:\n1. ${feedback1}`, "More confident and professional draft after feedback."); // Mock LLM for regeneration
        console.log(`Step 2: Providing feedback: "${feedback1}"`);
        let feedbackResult = await generatorConcept.feedback({ llm: mockLLM, feedback: feedback1 });
        console.log(`  Draft after feedback: "${feedbackResult.draft}"`);
        assertEquals(feedbackResult.draft, "More confident and professional draft after feedback.", "Trace: Draft should be regenerated.");
        assertArrayIncludes((await generatorConcept._getFeedbackHistory()).map(f => f.feedback), [feedback1], "Trace: Feedback 1 added.");
        assertEquals((await generatorConcept._getFeedbackHistory()).length, 1, "Trace: Total 1 feedback now.");
        console.log("Step 2 Complete.");

        // 3. User edits directly, LLM infers feedback
        const oldDraftBeforeEdit = (await generatorConcept._getDraft())[0].draft;
        const editedDraft = "Even more confident, professional, and concise draft, edited by user.";
        mockLLM.setFeedbackInference(
            oldDraftBeforeEdit!, // Asserting non-null because previous step guarantees it
            editedDraft,
            ["Improve conciseness.", "Enhance confidence further by user edit."]
        );
        console.log(`Step 3: User editing draft. Old: "${oldDraftBeforeEdit}", New: "${editedDraft}"`);
        let editResult = await generatorConcept.edit({ llm: mockLLM, newDraft: editedDraft });
        console.log(`  Draft after edit: "${(await generatorConcept._getDraft())[0].draft}"`);
        assertEquals(editResult.error, undefined, "Trace: Edit action should not return an error.");
        assertEquals((await generatorConcept._getDraft())[0].draft, editedDraft, "Trace: Draft should be directly edited.");
        const historyAfterEdit = (await generatorConcept._getFeedbackHistory()).map(f => f.feedback);
        assertArrayIncludes(historyAfterEdit, ["Improve conciseness.", "Enhance confidence further by user edit."], "Trace: Inferred feedback added.");
        assertEquals(historyAfterEdit.length, 3, "Trace: Total 3 feedbacks now (1 original + 2 inferred).");
        console.log("Step 3 Complete.");

        // 4. Accept the final draft
        console.log("Step 4: Accepting the final draft.");
        let acceptResult = await generatorConcept.accept();
        console.log(`  Accepted status: ${(await generatorConcept._getAcceptedStatus())[0].accepted}`);
        assertEquals(acceptResult.error, undefined, "Trace: Accept action should not return an error.");
        assertEquals((await generatorConcept._getAcceptedStatus())[0].accepted, true, "Trace: Final draft should be accepted.");
        console.log("Step 4 Complete.");

        console.log("Principle fulfilled: Generated initial draft, received feedback (causing regeneration), user edited directly (inferring feedback), and finally accepted the result.");
    });
});
```
