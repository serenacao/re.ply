---
timestamp: 'Thu Oct 30 2025 00:19:40 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251030_001940.b00b8cf0.md]]'
content_id: 35e876c540eb6e0546cdf9591001ef720286f68ce3dd2e159fcd0e3853620f79
---

# file: src/Generator/GeneratorConcept.test.ts

```typescript
import { assertEquals, assertExists } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ConceptGenerator, File, ILLM } from "./GeneratorConcept.ts";

// Mock LLM implementation for testing
class MockLLM implements ILLM {
    private responses: { [key: string]: string } = {};
    private defaultResponse: string = "Mock LLM response";
    private questionValidation: boolean = true;
    private feedbackValidation: boolean = true;
    private editFeedback: string[] = [];

    /**
     * Sets a specific response for a prompt containing a given part.
     * @param promptPart A substring to match in the LLM prompt.
     * @param response The specific response to return for that prompt.
     */
    setResponse(promptPart: string, response: string) {
        this.responses[promptPart] = response;
    }

    /**
     * Sets the default response for prompts that don't match a specific rule.
     * @param response The default string to return.
     */
    setDefaultResponse(response: string) {
        this.defaultResponse = response;
    }

    /**
     * Controls whether the mock LLM considers a question valid.
     * @param isValid True for valid, false for invalid.
     */
    setQuestionValidation(isValid: boolean) {
        this.questionValidation = isValid;
    }

    /**
     * Controls whether the mock LLM considers feedback valid.
     * @param isValid True for valid, false for invalid.
     */
    setFeedbackValidation(isValid: boolean) {
        this.feedbackValidation = isValid;
    }

    /**
     * Sets the feedback to be "inferred" by the LLM during an edit action.
     * @param feedback An array of strings representing inferred feedback.
     */
    setEditFeedback(feedback: string[]) {
        this.editFeedback = feedback;
    }

    /**
     * Simulates an LLM execution, returning predefined responses based on prompt content or defaults.
     * @param prompt The input prompt string.
     * @returns A promise resolving to the mock LLM's response.
     */
    async executeLLM(prompt: string): Promise<string> {
        // Mock validation for question type
        if (prompt.includes("Determine if the input is a message asking for help writing")) {
            return this.questionValidation ? "Yes" : "No";
        }
        // Mock validation for feedback type
        if (prompt.includes("Determine if the input is a message giving feedback")) {
            return this.feedbackValidation ? "Yes" : "No";
        }
        // Mock inference for edit feedback
        if (prompt.includes("You are an assistant that analyzes revisions to writing.")) {
            // Returns a JSON string representing a Python list, as expected by the concept
            return JSON.stringify(this.editFeedback);
        }

        // Return specific responses if a prompt part matches
        for (const promptPart in this.responses) {
            if (prompt.includes(promptPart)) {
                return this.responses[promptPart];
            }
        }
        // Fallback to default response
        return this.defaultResponse;
    }
}

// Main test suite for ConceptGenerator functionality
Deno.test("ConceptGenerator functionality", async (t) => {
    // The ConceptGenerator, as implemented, is primarily an in-memory state manager.
    // The `testDb` utility is included here for consistency with the overall concept implementation guidelines,
    // though the `db` and `client` objects are not directly utilized by ConceptGenerator itself.
    // The database is dropped before all tests in this file (via Deno.test.beforeAll in @utils/database.ts).
    const [db, client] = await testDb(); // Initialize DB for the entire test group

    // Teardown for the database client after all sub-tests in this suite are complete.
    // Deno.test.afterAll is correctly placed at the top-level of the module scope to run once.
    // However, when placed inside Deno.test(async (t) => {...}), it implies it runs after the current `t`'s children.
    // For consistency with typical Deno test file structure for resources, it's often at module root.
    // But since `client` is scoped here, this is a valid pattern for closing a resource opened within this test group.
    t.afterAll(async () => { // Using t.afterAll (scoped to this test block)
        await client.close();
        console.log("Database client closed after all ConceptGenerator tests.");
    });


    // Each t.step acts as an isolated test case.
    // We will initialize ConceptGenerator and MockLLM at the beginning of each t.step
    // to ensure a clean state for every sub-test, mimicking beforeEach behavior.

    await t.step("updateInput action: updates current files", () => {
        const generator = new ConceptGenerator(); // Fresh instance for this test step
        const mockLLM = new MockLLM(); // Fresh instance for this test step
        console.log("\n--- Test: updateInput action ---");
        const files: File[] = [{ name: "doc1.txt", content: "content1" }];
        generator.updateInput(files);
        // Accessing private property `currentFiles` for verification, common in testing private state
        assertEquals(generator["currentFiles"], files, "Effect: currentFiles should be updated.");
        console.log(`✅ Files updated to: ${JSON.stringify(generator["currentFiles"])}`);
    });

    await t.step("generate action: successfully generates a draft for a valid question", async () => {
        const generator = new ConceptGenerator(); // Fresh instance
        const mockLLM = new MockLLM(); // Fresh instance
        mockLLM.setQuestionValidation(true);
        mockLLM.setFeedbackValidation(true);
        mockLLM.setDefaultResponse("LLM generated content");
        mockLLM.setEditFeedback(["Minor style adjustments"]);

        console.log("\n--- Test: generate action (success) ---");
        const question = "Write a cover letter for a software engineer role.";
        const files: File[] = [{ name: "resume.pdf", content: "my resume content" }];
        const expectedDraft = "Generated cover letter for software engineer role.";
        mockLLM.setDefaultResponse(expectedDraft); // Set LLM to return this specific draft

        const result = await generator.generate(question, mockLLM, files);

        assertExists((result as { draft: string }).draft, "Effect: Result should contain a draft.");
        assertEquals((result as { draft: string }).draft, expectedDraft, "Effect: Returned draft content should match LLM output.");
        assertEquals(generator.getDraft(), expectedDraft, "Effect: Internal draft state should be updated.");
        assertEquals(generator.isAccepted(), false, "Effect: Accepted status should be false.");
        assertEquals(generator.getFeedbackHistory().length, 0, "Effect: Feedback history should be cleared.");
        assertEquals(generator.getQuestionInput(), question, "Effect: Question input should be set.");
        assertEquals(generator["currentFiles"], files, "Effect: Current files should be updated by generate.");

        console.log(`✅ Draft generated: "${generator.getDraft().substring(0, Math.min(generator.getDraft().length, 50))}..."`);
        console.log(`✅ Accepted status: ${generator.isAccepted()}`);
        console.log(`✅ Feedback history cleared: ${generator.getFeedbackHistory().length}`);
    });

    await t.step("generate action: fails if question is invalid (requires condition)", async () => {
        const generator = new ConceptGenerator(); // Fresh instance
        const mockLLM = new MockLLM(); // Fresh instance
        mockLLM.setQuestionValidation(true);
        mockLLM.setFeedbackValidation(true);
        mockLLM.setDefaultResponse("LLM generated content");
        mockLLM.setEditFeedback(["Minor style adjustments"]);

        console.log("\n--- Test: generate action (invalid question) ---");
        mockLLM.setQuestionValidation(false); // Simulate an invalid question
        const question = "What is the capital of France?"; // An invalid question according to classifier
        const files: File[] = [];

        const result = await generator.generate(question, mockLLM, files);

        assertExists((result as { error: string }).error, "Requires: Result should contain an error.");
        assertEquals((result as { error: string }).error, "The input is not a valid question.", "Requires: Error message should indicate invalid question.");
        assertEquals(generator.getDraft(), "", "Effect: Draft should remain empty upon failure.");
        console.log(`✅ Generation failed as expected: "${(result as { error: string }).error}"`);
    });

    await t.step("generate action: fails if draft is already accepted (requires condition)", async () => {
        const generator = new ConceptGenerator(); // Fresh instance
        const mockLLM = new MockLLM(); // Fresh instance
        mockLLM.setQuestionValidation(true);
        mockLLM.setFeedbackValidation(true);
        mockLLM.setDefaultResponse("LLM generated content");
        mockLLM.setEditFeedback(["Minor style adjustments"]);

        console.log("\n--- Test: generate action (already accepted) ---");
        const question = "Initial question.";
        const files: File[] = [];
        mockLLM.setDefaultResponse("Initial draft.");
        await generator.generate(question, mockLLM, files);
        generator.accept(); // Accept the draft, making further generation invalid

        const newQuestion = "New question.";
        const result = await generator.generate(newQuestion, mockLLM, files);

        assertExists((result as { error: string }).error, "Requires: Result should contain an error.");
        assertEquals((result as { error: string }).error, "Cannot generate new draft after current draft has been accepted.", "Requires: Error message should indicate accepted draft.");
        assertEquals(generator.getDraft(), "Initial draft.", "Effect: Draft should not change.");
        console.log(`✅ Generation failed as expected: "${(result as { error: string }).error}"`);
    });


    await t.step("accept action: successfully accepts a draft", async () => {
        const generator = new ConceptGenerator(); // Fresh instance
        const mockLLM = new MockLLM(); // Fresh instance
        mockLLM.setQuestionValidation(true);
        mockLLM.setFeedbackValidation(true);
        mockLLM.setDefaultResponse("LLM generated content");
        mockLLM.setEditFeedback(["Minor style adjustments"]);

        console.log("\n--- Test: accept action (success) ---");
        const question = "Draft to be accepted.";
        mockLLM.setDefaultResponse("This is the draft.");
        await generator.generate(question, mockLLM, []); // Generate a draft first

        const result = generator.accept();

        assertExists((result as { draft: string }).draft, "Effect: Result should contain the draft.");
        assertEquals((result as { draft: string }).draft, "This is the draft.", "Effect: Accepted draft should be returned.");
        assertEquals(generator.isAccepted(), true, "Effect: Accepted status should be true.");
        console.log(`✅ Draft accepted: "${generator.getDraft()}"`);
        console.log(`✅ Accepted status: ${generator.isAccepted()}`);
    });

    await t.step("accept action: fails if no draft exists (requires condition)", () => {
        const generator = new ConceptGenerator(); // Fresh instance
        const mockLLM = new MockLLM(); // Fresh instance
        mockLLM.setQuestionValidation(true);
        mockLLM.setFeedbackValidation(true);
        mockLLM.setDefaultResponse("LLM generated content");
        mockLLM.setEditFeedback(["Minor style adjustments"]);

        console.log("\n--- Test: accept action (no draft) ---");
        // No draft generated, so this action should fail
        const result = generator.accept();

        assertExists((result as { error: string }).error, "Requires: Result should contain an error.");
        assertEquals((result as { error: string }).error, "No question or draft exists to accept.", "Requires: Error message should indicate no draft.");
        console.log(`✅ Acceptance failed as expected: "${(result as { error: string }).error}"`);
    });

    await t.step("accept action: fails if draft is already accepted (requires condition)", async () => {
        const generator = new ConceptGenerator(); // Fresh instance
        const mockLLM = new MockLLM(); // Fresh instance
        mockLLM.setQuestionValidation(true);
        mockLLM.setFeedbackValidation(true);
        mockLLM.setDefaultResponse("LLM generated content");
        mockLLM.setEditFeedback(["Minor style adjustments"]);

        console.log("\n--- Test: accept action (already accepted) ---");
        const question = "Draft already accepted.";
        mockLLM.setDefaultResponse("An already accepted draft.");
        await generator.generate(question, mockLLM, []);
        generator.accept(); // First acceptance

        const result = generator.accept(); // Attempt to accept again

        assertExists((result as { error: string }).error, "Requires: Result should contain an error.");
        assertEquals((result as { error: string }).error, "Draft is already accepted.", "Requires: Error message should indicate already accepted.");
        console.log(`✅ Acceptance failed as expected: "${(result as { error: string }).error}"`);
    });

    await t.step("edit action: successfully edits a draft", async () => {
        const generator = new ConceptGenerator(); // Fresh instance
        const mockLLM = new MockLLM(); // Fresh instance
        mockLLM.setQuestionValidation(true);
        mockLLM.setFeedbackValidation(true);
        mockLLM.setDefaultResponse("LLM generated content");
        mockLLM.setEditFeedback(["Minor style adjustments"]);

        console.log("\n--- Test: edit action (success) ---");
        const question = "Draft to be edited.";
        mockLLM.setDefaultResponse("Original draft content.");
        await generator.generate(question, mockLLM, []); // Generate initial draft
        const originalDraft = generator.getDraft();

        const newDraft = "Revised draft content.";
        const inferredFeedback = ["Changed wording", "Improved clarity"];
        mockLLM.setEditFeedback(inferredFeedback); // Mock LLM inferring this feedback from the edit
        const result = await generator.edit(mockLLM, newDraft);

        assertEquals(result, {}, "Effect: Result should be an empty object on success.");
        assertEquals(generator.getDraft(), newDraft, "Effect: Draft should be updated to newDraft.");
        assertEquals(generator.isAccepted(), false, "Effect: Accepted status should remain false.");
        assertEquals(generator.getFeedbackHistory(), inferredFeedback, "Effect: Feedback history should be updated from edit.");
        console.log(`✅ Draft edited from "${originalDraft.substring(0, Math.min(originalDraft.length, 20))}..." to "${generator.getDraft().substring(0, Math.min(generator.getDraft().length, 20))}..."`);
        console.log(`✅ Feedback history: ${JSON.stringify(generator.getFeedbackHistory())}`);
    });

    await t.step("edit action: does not add feedback if draft is unchanged", async () => {
        const generator = new ConceptGenerator(); // Fresh instance
        const mockLLM = new MockLLM(); // Fresh instance
        mockLLM.setQuestionValidation(true);
        mockLLM.setFeedbackValidation(true);
        mockLLM.setDefaultResponse("LLM generated content");
        mockLLM.setEditFeedback(["Minor style adjustments"]);

        console.log("\n--- Test: edit action (no change) ---");
        const question = "Draft to be edited.";
        mockLLM.setDefaultResponse("Original draft content.");
        await generator.generate(question, mockLLM, []); // Generate initial draft
        const originalDraft = generator.getDraft();

        mockLLM.setEditFeedback([]); // Ensure no feedback is returned by the mock LLM if draft is unchanged
        const result = await generator.edit(mockLLM, originalDraft); // Edit with no actual change

        assertEquals(result, {}, "Effect: Result should be an empty object on success.");
        assertEquals(generator.getDraft(), originalDraft, "Effect: Draft should remain unchanged.");
        assertEquals(generator.getFeedbackHistory().length, 0, "Effect: Feedback history should NOT be updated if draft is unchanged.");
        console.log(`✅ Draft unchanged: "${generator.getDraft().substring(0, Math.min(originalDraft.length, 20))}..."`);
        console.log(`✅ Feedback history: ${JSON.stringify(generator.getFeedbackHistory())}`);
    });

    await t.step("edit action: fails if no draft exists (requires condition)", async () => {
        const generator = new ConceptGenerator(); // Fresh instance
        const mockLLM = new MockLLM(); // Fresh instance
        mockLLM.setQuestionValidation(true);
        mockLLM.setFeedbackValidation(true);
        mockLLM.setDefaultResponse("LLM generated content");
        mockLLM.setEditFeedback(["Minor style adjustments"]);

        console.log("\n--- Test: edit action (no draft) ---");
        // No draft generated
        const result = await generator.edit(mockLLM, "Some new text.");

        assertExists((result as { error: string }).error, "Requires: Result should contain an error.");
        assertEquals((result as { error: string }).error, "No draft exists to edit.", "Requires: Error message should indicate no draft.");
        console.log(`✅ Edit failed as expected: "${(result as { error: string }).error}"`);
    });

    await t.step("edit action: fails if draft is accepted (requires condition)", async () => {
        const generator = new ConceptGenerator(); // Fresh instance
        const mockLLM = new MockLLM(); // Fresh instance
        mockLLM.setQuestionValidation(true);
        mockLLM.setFeedbackValidation(true);
        mockLLM.setDefaultResponse("LLM generated content");
        mockLLM.setEditFeedback(["Minor style adjustments"]);

        console.log("\n--- Test: edit action (accepted draft) ---");
        const question = "Draft accepted.";
        mockLLM.setDefaultResponse("This draft is accepted.");
        await generator.generate(question, mockLLM, []);
        generator.accept(); // Accept the draft

        const result = await generator.edit(mockLLM, "New content for accepted draft."); // Attempt to edit accepted draft

        assertExists((result as { error: string }).error, "Requires: Result should contain an error.");
        assertEquals((result as { error: string }).error, "Cannot edit an accepted draft.", "Requires: Error message should indicate accepted draft.");
        assertEquals(generator.getDraft(), "This draft is accepted.", "Effect: Draft should not change.");
        console.log(`✅ Edit failed as expected: "${(result as { error: string }).error}"`);
    });

    await t.step("feedback action: successfully applies feedback and regenerates draft", async () => {
        const generator = new ConceptGenerator(); // Fresh instance
        const mockLLM = new MockLLM(); // Fresh instance
        mockLLM.setQuestionValidation(true);
        mockLLM.setFeedbackValidation(true);
        mockLLM.setDefaultResponse("LLM generated content");
        mockLLM.setEditFeedback(["Minor style adjustments"]);

        console.log("\n--- Test: feedback action (success) ---");
        const question = "Initial draft for feedback.";
        mockLLM.setDefaultResponse("First draft content.");
        await generator.generate(question, mockLLM, []); // Generate initial draft
        const initialDraft = generator.getDraft();

        const feedbackComment = "Make it more concise and formal.";
        const expectedRevisedDraft = "Revised draft content (concise and formal).";
        mockLLM.setDefaultResponse(expectedRevisedDraft); // Set LLM to return this revised draft for regeneration

        const result = await generator.feedback(mockLLM, feedbackComment);

        assertExists((result as { draft: string }).draft, "Effect: Result should contain a draft.");
        assertEquals((result as { draft: string }).draft, expectedRevisedDraft, "Effect: Draft should be regenerated based on feedback.");
        assertEquals(generator.getDraft(), expectedRevisedDraft, "Effect: Internal draft state should be updated.");
        assertEquals(generator.getFeedbackHistory(), [feedbackComment], "Effect: Feedback should be added to history.");
        assertEquals(generator.isAccepted(), false, "Effect: Accepted status should remain false.");
        console.log(`✅ Feedback applied. New draft: "${generator.getDraft().substring(0, Math.min(generator.getDraft().length, 50))}..."`);
        console.log(`✅ Feedback history: ${JSON.stringify(generator.getFeedbackHistory())}`);
    });

    await t.step("feedback action: accumulates feedback and regenerates with all feedback", async () => {
        const generator = new ConceptGenerator(); // Fresh instance
        const mockLLM = new MockLLM(); // Fresh instance
        mockLLM.setQuestionValidation(true);
        mockLLM.setFeedbackValidation(true);
        mockLLM.setDefaultResponse("LLM generated content");
        mockLLM.setEditFeedback(["Minor style adjustments"]);

        console.log("\n--- Test: feedback action (multiple feedback) ---");
        const question = "Draft for multiple feedback rounds.";
        mockLLM.setDefaultResponse("Draft v1.");
        await generator.generate(question, mockLLM, []); // Generate initial draft

        const feedback1 = "Add more detail.";
        mockLLM.setFeedbackValidation(true); // Ensure feedback is valid
        mockLLM.setDefaultResponse("Draft v2 with more detail.");
        await generator.feedback(mockLLM, feedback1);

        const feedback2 = "Shorten the introduction.";
        mockLLM.setFeedbackValidation(true); // Ensure feedback is valid
        mockLLM.setDefaultResponse("Draft v3 (shorter intro, more detail).");
        await generator.feedback(mockLLM, feedback2);

        assertEquals(generator.getFeedbackHistory(), [feedback1, feedback2], "Effect: All feedback should be accumulated.");
        assertEquals(generator.getDraft(), "Draft v3 (shorter intro, more detail).", "Effect: Draft should reflect all accumulated feedback.");
        console.log(`✅ Multiple feedback rounds applied. Final draft: "${generator.getDraft().substring(0, Math.min(generator.getDraft().length, 50))}..."`);
        console.log(`✅ Full feedback history: ${JSON.stringify(generator.getFeedbackHistory())}`);
    });

    await t.step("feedback action: fails if no draft exists (requires condition)", async () => {
        const generator = new ConceptGenerator(); // Fresh instance
        const mockLLM = new MockLLM(); // Fresh instance
        mockLLM.setQuestionValidation(true);
        mockLLM.setFeedbackValidation(true);
        mockLLM.setDefaultResponse("LLM generated content");
        mockLLM.setEditFeedback(["Minor style adjustments"]);

        console.log("\n--- Test: feedback action (no draft) ---");
        // No draft generated
        const result = await generator.feedback(mockLLM, "Some feedback.");

        assertExists((result as { error: string }).error, "Requires: Result should contain an error.");
        assertEquals((result as { error: string }).error, "No draft exists to provide feedback on.", "Requires: Error message should indicate no draft.");
        console.log(`✅ Feedback failed as expected: "${(result as { error: string }).error}"`);
    });

    await t.step("feedback action: fails if draft is accepted (requires condition)", async () => {
        const generator = new ConceptGenerator(); // Fresh instance
        const mockLLM = new MockLLM(); // Fresh instance
        mockLLM.setQuestionValidation(true);
        mockLLM.setFeedbackValidation(true);
        mockLLM.setDefaultResponse("LLM generated content");
        mockLLM.setEditFeedback(["Minor style adjustments"]);

        console.log("\n--- Test: feedback action (accepted draft) ---");
        const question = "Draft accepted.";
        mockLLM.setDefaultResponse("This draft is accepted.");
        await generator.generate(question, mockLLM, []);
        generator.accept(); // Accept the draft

        const result = await generator.feedback(mockLLM, "Feedback on accepted draft."); // Attempt to provide feedback

        assertExists((result as { error: string }).error, "Requires: Result should contain an error.");
        assertEquals((result as { error: string }).error, "Cannot provide feedback on an accepted draft.", "Requires: Error message should indicate accepted draft.");
        assertEquals(generator.getDraft(), "This draft is accepted.", "Effect: Draft should not change.");
        console.log(`✅ Feedback failed as expected: "${(result as { error: string }).error}"`);
    });

    await t.step("feedback action: fails if feedback is invalid (requires condition)", async () => {
        const generator = new ConceptGenerator(); // Fresh instance
        const mockLLM = new MockLLM(); // Fresh instance
        mockLLM.setQuestionValidation(true);
        mockLLM.setFeedbackValidation(true);
        mockLLM.setDefaultResponse("LLM generated content");
        mockLLM.setEditFeedback(["Minor style adjustments"]);

        console.log("\n--- Test: feedback action (invalid feedback) ---");
        mockLLM.setFeedbackValidation(false); // Simulate invalid feedback
        const question = "Draft for invalid feedback.";
        mockLLM.setDefaultResponse("Some draft content.");
        await generator.generate(question, mockLLM, []); // Generate initial draft

        const result = await generator.feedback(mockLLM, "What is your favorite color?"); // Invalid feedback

        assertExists((result as { error: string }).error, "Requires: Result should contain an error.");
        assertEquals((result as { error: string }).error, "Please submit valid actionable feedback.", "Requires: Error message should indicate invalid feedback.");
        assertEquals(generator.getFeedbackHistory().length, 0, "Effect: Feedback history should not include invalid feedback.");
        console.log(`✅ Feedback failed as expected: "${(result as { error: string }).error}"`);
    });

    await t.step("Principle trace: generate -> feedback -> regenerate, or generate -> accept/edit", async () => {
        const generator = new ConceptGenerator(); // Fresh instance
        const mockLLM = new MockLLM(); // Fresh instance
        mockLLM.setQuestionValidation(true);
        mockLLM.setFeedbackValidation(true);
        mockLLM.setDefaultResponse("LLM generated content");
        mockLLM.setEditFeedback(["Minor style adjustments"]);

        console.log("\n--- Trace: Principle Fulfillment ---");
        console.log(`Principle: "after the LLM generates answertype to the question, if there is user feedback, it will regenerate its output. Otherwise, the user can edit it or copy it for their use."`);

        const question = "Draft a LinkedIn summary for a software engineer.";
        const files: File[] = [{ name: "profile.json", content: "{name: 'Jane Doe', experience: '5 years SE'}" }];
        const initialDraft = "Initial LinkedIn summary generated by LLM for Jane Doe.";
        const feedback1 = "Make it more professional and highlight achievements.";
        const revisedDraft1 = "Revised LinkedIn summary: Professional tone, key achievements highlighted for Jane Doe.";
        const feedback2 = "Add keywords for AI and machine learning expertise.";
        const revisedDraft2 = "Revised LinkedIn summary: Professional, achievements, AI/ML keywords included for Jane Doe.";

        // 1. Generate initial draft
        console.log("\nStep 1: Generating initial draft.");
        mockLLM.setDefaultResponse(initialDraft);
        const genResult = await generator.generate(question, mockLLM, files);
        assertEquals((genResult as { draft: string }).draft, initialDraft, "Initial generation should succeed and return draft.");
        assertEquals(generator.getDraft(), initialDraft, "Internal draft state should be updated.");
        assertEquals(generator.isAccepted(), false, "Draft should not be accepted yet.");
        console.log(`   Action: generate("${question}", ..., ${JSON.stringify(files)}) -> ${JSON.stringify(genResult)}`);
        console.log(`   Current Draft: "${generator.getDraft().substring(0, Math.min(generator.getDraft().length, 70))}..."`);
        console.log(`   Accepted: ${generator.isAccepted()}`);

        // 2. Apply first feedback (triggering regeneration)
        console.log("\nStep 2: Applying first feedback to regenerate the draft.");
        mockLLM.setDefaultResponse(revisedDraft1); // Set mock response for regeneration
        const feedbackResult1 = await generator.feedback(mockLLM, feedback1);
        assertEquals((feedbackResult1 as { draft: string }).draft, revisedDraft1, "First feedback should regenerate the draft.");
        assertEquals(generator.getDraft(), revisedDraft1, "Draft should be updated after first feedback.");
        assertEquals(generator.getFeedbackHistory(), [feedback1], "First feedback should be recorded in history.");
        console.log(`   Action: feedback(..., "${feedback1}") -> ${JSON.stringify(feedbackResult1)}`);
        console.log(`   Current Draft: "${generator.getDraft().substring(0, Math.min(generator.getDraft().length, 70))}..."`);
        console.log(`   Feedback History: ${JSON.stringify(generator.getFeedbackHistory())}`);

        // 3. Apply second feedback (triggering another regeneration)
        console.log("\nStep 3: Applying second feedback to further regenerate the draft.");
        mockLLM.setDefaultResponse(revisedDraft2); // Set mock response for regeneration
        const feedbackResult2 = await generator.feedback(mockLLM, feedback2);
        assertEquals((feedbackResult2 as { draft: string }).draft, revisedDraft2, "Second feedback should regenerate the draft.");
        assertEquals(generator.getDraft(), revisedDraft2, "Draft should be updated after second feedback.");
        assertEquals(generator.getFeedbackHistory(), [feedback1, feedback2], "Both feedback entries should be recorded in history.");
        console.log(`   Action: feedback(..., "${feedback2}") -> ${JSON.stringify(feedbackResult2)}`);
        console.log(`   Current Draft: "${generator.getDraft().substring(0, Math.min(generator.getDraft().length, 70))}..."`);
        console.log(`   Feedback History: ${JSON.stringify(generator.getFeedbackHistory())}`);

        // 4. User decides to edit directly instead of more feedback
        console.log("\nStep 4: User manually edits the draft.");
        const userEditDraft = "User manually edited version, carefully incorporating all feedback and polishing the tone and flow.";
        const inferredFeedbackFromEdit = ["Manual edits for clarity and conciseness", "Polished wording and flow"];
        mockLLM.setEditFeedback(inferredFeedbackFromEdit); // Mock inferred feedback from edit
        const editResult = await generator.edit(mockLLM, userEditDraft);
        assertEquals(editResult, {}, "Manual edit should return an empty object on success.");
        assertEquals(generator.getDraft(), userEditDraft, "Draft should be updated by manual edit.");
        // Ensure feedback history correctly includes both LLM-generated and inferred from edit feedback
        assertEquals(generator.getFeedbackHistory(), [feedback1, feedback2, ...inferredFeedbackFromEdit], "All feedback (including inferred from edit) should be recorded.");
        console.log(`   Action: edit(..., "${userEditDraft}") -> ${JSON.stringify(editResult)}`);
        console.log(`   Current Draft: "${generator.getDraft().substring(0, Math.min(generator.getDraft().length, 70))}..."`);
        console.log(`   Feedback History after edit: ${JSON.stringify(generator.getFeedbackHistory())}`);

        // 5. User accepts the final draft
        console.log("\nStep 5: User accepts the final draft.");
        const acceptResult = generator.accept();
        assertEquals((acceptResult as { draft: string }).draft, userEditDraft, "Accepted result should return the final draft.");
        assertEquals(generator.isAccepted(), true, "Draft should be marked as accepted.");
        console.log(`   Action: accept() -> ${JSON.stringify(acceptResult)}`);
        console.log(`   Current Draft: "${generator.getDraft().substring(0, Math.min(generator.getDraft().length, 70))}..."`);
        console.log(`   Accepted: ${generator.isAccepted()}`);

        console.log("\n--- Principle Fulfillment Conclusion ---");
        console.log("This trace successfully demonstrates the Concept Generator's principle by showing the full lifecycle:");
        console.log("  - Initial draft generation from a question and files.");
        console.log("  - Multiple rounds of user feedback leading to draft regeneration by the LLM.");
        console.log("  - Direct user editing of the draft, with inferred feedback being recorded.");
        console.log("  - Final acceptance of the refined draft.");
        console.log("This sequence covers both paths: LLM-driven regeneration via feedback, and user-driven refinement via editing, leading to an accepted output.");
    });
});
```
