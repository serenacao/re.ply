[@implementation](Implementation.md)
[@generator-concept](/design/concepts/Generator/Generator.md)


[@testing-concepts](../../background/testing-concepts.md)

# test: Generator
# prompt: please note that t.afterAll and t.beforeEach do not exist in Deno, and be careful to not use them.

# response:


# response:

```typescript
// file: src/Generator/GeneratorConcept.test.ts
import { assertEquals, assertNotEquals, assertArrayIncludes } from "jsr:@std/assert";
import { ConceptGenerator, File, ILLM } from "./GeneratorConcept.ts"; // Adjust path as necessary if structure differs

// --- Mock LLM Implementation ---
class MockLLM implements ILLM {
    private responses: Record<string, string> = {};
    private defaultResponse: string = "This is a generated draft.";
    private questionValidationResponse: string = "Yes"; // Default to valid question
    private feedbackValidationResponse: string = "Yes"; // Default to valid feedback
    private editFeedbackResponse: string = `["Made it more concise.", "Improved tone."]` // Default for edit feedback
    private regeneratedResponse: string = "This is a regenerated draft based on feedback.";

    setResponse(promptPart: string, response: string) {
        this.responses[promptPart] = response;
    }

    setDefaultResponse(response: string) {
        this.defaultResponse = response;
    }

    setQuestionValidation(isValid: boolean) {
        this.questionValidationResponse = isValid ? "Yes" : "No";
    }

    setFeedbackValidation(isValid: boolean) {
        this.feedbackValidationResponse = isValid ? "Yes" : "No";
    }

    setRegeneratedResponse(response: string) {
        this.regeneratedResponse = response;
    }

    setEditFeedbackResponse(response: string) {
        this.editFeedbackResponse = response;
    }

    async executeLLM(prompt: string): Promise<string> {
        // console.log(`MockLLM received prompt:\n${prompt}`); // Uncomment for verbose debugging of LLM prompts
        if (prompt.includes("Determine if the input is a message asking for help writing")) {
            return this.questionValidationResponse;
        }
        if (prompt.includes("Determine if the input is a message giving feedback")) {
            return this.feedbackValidationResponse;
        }
        if (prompt.includes("You are an assistant that analyzes revisions to writing.")) {
            return this.editFeedbackResponse;
        }
        if (prompt.includes("Please revise the draft accordingly.")) {
            return this.regeneratedResponse;
        }
        for (const key in this.responses) {
            if (prompt.includes(key)) {
                return this.responses[key];
            }
        }
        return this.defaultResponse;
    }
}

Deno.test("Generator Concept Tests", async (t) => {
    // The ConceptGenerator class manages its state purely in-memory.
    // Therefore, the `testDb` utility (which is for MongoDB setup/teardown) is not directly used here.
    // Each test step will manually initialize the ConceptGenerator and MockLLM instances.

    let generator: ConceptGenerator;
    let mockLLM: MockLLM;

    // --- Initial State Verification ---
    await t.step("Initial state should be empty and not accepted", () => {
        console.log("\n--- Test: Initial state ---");
        generator = new ConceptGenerator(); // Initialize a fresh generator

        console.log(`Expected: Draft is empty string`);
        console.log(`Actual: Draft is "${generator.getDraft()}"`);
        assertEquals(generator.getDraft(), "");

        console.log(`Expected: Accepted status is false`);
        console.log(`Actual: Accepted status is ${generator.isAccepted()}`);
        assertEquals(generator.isAccepted(), false);

        console.log(`Expected: Feedback history is empty`);
        console.log(`Actual: Feedback history is ${JSON.stringify(generator.getFeedbackHistory())}`);
        assertEquals(generator.getFeedbackHistory().length, 0);
    });

    // --- Action: generate ---
    await t.step("Action: generate - successful generation with valid question", async () => {
        console.log("\n--- Test: generate - success ---");
        generator = new ConceptGenerator();
        mockLLM = new MockLLM();
        mockLLM.setQuestionValidation(true); // Fulfills 'requires: question is a valid question'

        const question = "Write a cover letter for a software engineer position at Google.";
        const files: File[] = [{ name: "resume.txt", content: "My resume details..." }];
        const expectedDraftContent = "This is a generated draft for the cover letter.";
        mockLLM.setDefaultResponse(expectedDraftContent); // Mock LLM's response

        console.log(`Calling generate with question: "${question}" and files. Mock LLM will deem question valid.`);
        const result = await generator.generate(question, mockLLM, files);

        // Verify effects
        assertEquals(typeof result, 'object');
        if ('error' in result) {
            console.error(`❌ Error during generation: ${result.error}`);
            throw new Error(`Generation unexpectedly failed: ${result.error}`);
        }
        console.log(`Effect: Draft is set. Expected: "${expectedDraftContent}", Actual: "${result.draft}"`);
        assertEquals(result.draft, expectedDraftContent);
        assertEquals(generator.getDraft(), expectedDraftContent);

        console.log(`Effect: Accepted status is false. Expected: false, Actual: ${generator.isAccepted()}`);
        assertEquals(generator.isAccepted(), false);

        console.log(`Effect: Feedback history is empty. Expected: 0 entries, Actual: ${generator.getFeedbackHistory().length} entries`);
        assertEquals(generator.getFeedbackHistory().length, 0);

        console.log(`Effect: Question input is stored. Expected: "${question}", Actual: "${generator.getQuestionInput()}"`);
        assertEquals(generator.getQuestionInput(), question);
        console.log(`✅ Draft generated successfully.`);
    });

    await t.step("Action: generate - fails with invalid question", async () => {
        console.log("\n--- Test: generate - invalid question ---");
        generator = new ConceptGenerator();
        mockLLM = new MockLLM();
        mockLLM.setQuestionValidation(false); // Violates 'requires: question is a valid question'

        const question = "What is the meaning of life?";
        const files: File[] = [];

        console.log(`Attempting to generate with invalid question: "${question}". Mock LLM will deem question invalid.`);
        const result = await generator.generate(question, mockLLM, files);

        // Verify that an error is returned and no state changes
        assertEquals(typeof result, 'object');
        if (!('error' in result)) {
            console.error("❌ Expected an error, but no error was returned.");
            throw new Error("Expected an error for invalid question.");
        }
        console.log(`Effect: Returns error. Expected: "The input is not a valid question.", Actual: "${result.error}"`);
        assertEquals(result.error, "The input is not a valid question.");

        console.log(`Effect: Draft remains empty. Expected: "", Actual: "${generator.getDraft()}"`);
        assertEquals(generator.getDraft(), ""); // No draft should be set

        console.log(`Effect: Accepted status remains false. Expected: false, Actual: ${generator.isAccepted()}`);
        assertEquals(generator.isAccepted(), false);
        console.log(`✅ Generation failed as expected due to invalid question.`);
    });

    await t.step("Action: generate - fails if already accepted draft exists", async () => {
        console.log("\n--- Test: generate - accepted draft exists ---");
        generator = new ConceptGenerator();
        mockLLM = new MockLLM();
        mockLLM.setQuestionValidation(true);
        const firstQuestion = "Generate a summary.";
        const firstDraft = "First draft content.";
        mockLLM.setDefaultResponse(firstDraft);

        await generator.generate(firstQuestion, mockLLM, []);
        generator.accept(); // Set draft to accepted

        console.log(`Initial draft generated and accepted. Attempting to generate a new draft.`);
        const secondQuestion = "Write a new item.";
        const generateResult = await generator.generate(secondQuestion, mockLLM, []);

        assertEquals(typeof generateResult, 'object');
        if (!('error' in generateResult)) {
            console.error("❌ Expected an error, but no error was returned.");
            throw new Error("Expected an error.");
        }
        console.log(`Effect: Returns error. Expected: "Cannot generate new draft after current draft has been accepted.", Actual: "${generateResult.error}"`);
        assertEquals(generateResult.error, "Cannot generate new draft after current draft has been accepted.");
        console.log(`Effect: Previous draft and accepted status remain. Draft: "${generator.getDraft()}", Accepted: ${generator.isAccepted()}`);
        assertEquals(generator.getDraft(), firstDraft);
        assertEquals(generator.isAccepted(), true);
        console.log(`✅ Generation failed as expected because a draft was already accepted.`);
    });


    // --- Action: accept ---
    await t.step("Action: accept - successful acceptance", async () => {
        console.log("\n--- Test: accept - success ---");
        generator = new ConceptGenerator();
        mockLLM = new MockLLM();
        mockLLM.setQuestionValidation(true);
        const draftContent = "This is the draft to be accepted.";
        mockLLM.setDefaultResponse(draftContent);
        await generator.generate("Generate a summary.", mockLLM, []); // Fulfills 'requires: question to exist'
        const initialDraft = generator.getDraft();

        console.log(`Current draft before accepting: "${initialDraft}". Accepted status: ${generator.isAccepted()}`);
        const result = generator.accept(); // Fulfills 'requires: draft status is not accepted'

        // Verify effects
        assertEquals(typeof result, 'object');
        if ('error' in result) {
            console.error(`❌ Error during acceptance: ${result.error}`);
            throw new Error(`Acceptance unexpectedly failed: ${result.error}`);
        }
        console.log(`Effect: Accepted status is true. Expected: true, Actual: ${generator.isAccepted()}`);
        assertEquals(generator.isAccepted(), true);

        console.log(`Effect: Returns the draft. Expected: "${initialDraft}", Actual: "${result.draft}"`);
        assertEquals(result.draft, initialDraft);
        console.log(`✅ Draft accepted successfully.`);
    });

    await t.step("Action: accept - fails if no draft exists", () => {
        console.log("\n--- Test: accept - no draft ---");
        generator = new ConceptGenerator(); // No generate action called, so no question/draft

        console.log("Attempting to accept without a generated draft.");
        const result = generator.accept(); // Violates 'requires: question to exist'

        // Verify that an error is returned and no state changes
        assertEquals(typeof result, 'object');
        if (!('error' in result)) {
            console.error("❌ Expected an error, but no error was returned.");
            throw new Error("Expected an error for no draft.");
        }
        console.log(`Effect: Returns error. Expected: "No question or draft exists to accept.", Actual: "${result.error}"`);
        assertEquals(result.error, "No question or draft exists to accept.");

        console.log(`Effect: Accepted status remains false. Expected: false, Actual: ${generator.isAccepted()}`);
        assertEquals(generator.isAccepted(), false);
        console.log(`✅ Acceptance failed as expected due to no existing draft.`);
    });

    await t.step("Action: accept - fails if already accepted", async () => {
        console.log("\n--- Test: accept - already accepted ---");
        generator = new ConceptGenerator();
        mockLLM = new MockLLM();
        mockLLM.setQuestionValidation(true);
        const draftContent = "Already accepted content.";
        mockLLM.setDefaultResponse(draftContent);
        await generator.generate("Generate text.", mockLLM, []);
        generator.accept(); // First acceptance makes it accepted

        console.log("Attempting to accept an already accepted draft.");
        const result = generator.accept(); // Second acceptance, violates 'requires: draft status is not accepted'

        // Verify that an error is returned and state remains unchanged
        assertEquals(typeof result, 'object');
        if (!('error' in result)) {
            console.error("❌ Expected an error, but no error was returned.");
            throw new Error("Expected an error for already accepted draft.");
        }
        console.log(`Effect: Returns error. Expected: "Draft is already accepted.", Actual: "${result.error}"`);
        assertEquals(result.error, "Draft is already accepted.");

        console.log(`Effect: Accepted status remains true. Expected: true, Actual: ${generator.isAccepted()}`);
        assertEquals(generator.isAccepted(), true); // Should remain accepted
        console.log(`✅ Acceptance failed as expected because the draft was already accepted.`);
    });

    // --- Action: edit ---
    await t.step("Action: edit - successful edit and feedback history update", async () => {
        console.log("\n--- Test: edit - success ---");
        generator = new ConceptGenerator();
        mockLLM = new MockLLM();
        mockLLM.setQuestionValidation(true);
        const originalQuestion = "Write a short bio.";
        const initialDraftContent = "This is the initial, slightly verbose bio.";
        mockLLM.setDefaultResponse(initialDraftContent);
        await generator.generate(originalQuestion, mockLLM, []); // Fulfills 'requires: draft already exists'
        const newDraft = "This is the edited bio, now more concise.";
        const inferredFeedback = ["Made it more concise."];
        mockLLM.setEditFeedbackResponse(JSON.stringify(inferredFeedback)); // Mock LLM inferring feedback

        console.log(`Original draft: "${initialDraftContent}"`);
        console.log(`New draft for editing: "${newDraft}"`);
        const result = await generator.edit(mockLLM, newDraft); // Fulfills 'requires: draft status is not accepted'

        // Verify effects
        assertEquals(typeof result, 'object');
        if ('error' in result) {
            console.error(`❌ Error during edit: ${result.error}`);
            throw new Error(`Edit unexpectedly failed: ${result.error}`);
        }
        console.log(`Effect: Draft is replaced. Expected: "${newDraft}", Actual: "${generator.getDraft()}"`);
        assertEquals(generator.getDraft(), newDraft);

        console.log(`Effect: Accepted status remains false. Expected: false, Actual: ${generator.isAccepted()}`);
        assertEquals(generator.isAccepted(), false);

        console.log(`Effect: Feedback history updated with inferred feedback.`);
        console.log(`Expected: ${JSON.stringify(inferredFeedback)}, Actual: ${JSON.stringify(generator.getFeedbackHistory())}`);
        assertArrayIncludes(generator.getFeedbackHistory(), inferredFeedback);
        console.log(`✅ Draft edited successfully and feedback history updated.`);
    });

    await t.step("Action: edit - fails if no draft exists", async () => {
        console.log("\n--- Test: edit - no draft ---");
        generator = new ConceptGenerator();
        mockLLM = new MockLLM();

        console.log("Attempting to edit without a generated draft.");
        const result = await generator.edit(mockLLM, "Some new text."); // Violates 'requires: draft already exists'

        // Verify that an error is returned and no state changes
        assertEquals(typeof result, 'object');
        if (!('error' in result)) {
            console.error("❌ Expected an error, but no error was returned.");
            throw new Error("Expected an error for no draft.");
        }
        console.log(`Effect: Returns error. Expected: "No draft exists to edit.", Actual: "${result.error}"`);
        assertEquals(result.error, "No draft exists to edit.");

        console.log(`Effect: Draft remains empty. Expected: "", Actual: "${generator.getDraft()}"`);
        assertEquals(generator.getDraft(), "");
        console.log(`✅ Edit failed as expected due to no existing draft.`);
    });

    await t.step("Action: edit - fails if accepted", async () => {
        console.log("\n--- Test: edit - accepted draft ---");
        generator = new ConceptGenerator();
        mockLLM = new MockLLM();
        mockLLM.setQuestionValidation(true);
        const draftContent = "Accepted draft content.";
        mockLLM.setDefaultResponse(draftContent);
        await generator.generate("Generate text.", mockLLM, []);
        generator.accept(); // Set draft to accepted

        console.log("Attempting to edit an accepted draft.");
        const result = await generator.edit(mockLLM, "Some new text."); // Violates 'requires: draft status is not accepted'

        // Verify that an error is returned and state remains unchanged
        assertEquals(typeof result, 'object');
        if (!('error' in result)) {
            console.error("❌ Expected an error, but no error was returned.");
            throw new Error("Expected an error for accepted draft.");
        }
        console.log(`Effect: Returns error. Expected: "Cannot edit an accepted draft.", Actual: "${result.error}"`);
        assertEquals(result.error, "Cannot edit an accepted draft.");

        console.log(`Effect: Draft remains unchanged. Expected: "${draftContent}", Actual: "${generator.getDraft()}"`);
        assertEquals(generator.getDraft(), draftContent);
        console.log(`Effect: Accepted status remains true. Expected: true, Actual: ${generator.isAccepted()}`);
        assertEquals(generator.isAccepted(), true);
        console.log(`✅ Edit failed as expected because the draft was already accepted.`);
    });

    // --- Action: feedback ---
    await t.step("Action: feedback - successful regeneration with valid feedback", async () => {
        console.log("\n--- Test: feedback - success ---");
        generator = new ConceptGenerator();
        mockLLM = new MockLLM();
        mockLLM.setQuestionValidation(true);
        const initialDraftContent = "This is the initial paragraph.";
        mockLLM.setDefaultResponse(initialDraftContent);
        await generator.generate("Write a paragraph.", mockLLM, []); // Fulfills 'requires: draft has not yet been accepted'
        const feedbackComment = "Make it more professional.";
        const regeneratedText = "This is the more professional paragraph.";
        mockLLM.setFeedbackValidation(true); // Fulfills 'requires: feedback to be a valid feedback'
        mockLLM.setRegeneratedResponse(regeneratedText); // Mock LLM's response for regeneration

        console.log(`Initial draft: "${initialDraftContent}"`);
        console.log(`Providing feedback: "${feedbackComment}"`);
        const result = await generator.feedback(mockLLM, feedbackComment);

        // Verify effects
        assertEquals(typeof result, 'object');
        if ('error' in result) {
            console.error(`❌ Error during feedback: ${result.error}`);
            throw new Error(`Feedback unexpectedly failed: ${result.error}`);
        }
        console.log(`Effect: Draft is regenerated. Expected: "${regeneratedText}", Actual: "${result.draft}"`);
        assertEquals(result.draft, regeneratedText);
        assertEquals(generator.getDraft(), regeneratedText);

        console.log(`Effect: Accepted status remains false. Expected: false, Actual: ${generator.isAccepted()}`);
        assertEquals(generator.isAccepted(), false);

        console.log(`Effect: Feedback history includes new feedback. Expected: ["${feedbackComment}"], Actual: ${JSON.stringify(generator.getFeedbackHistory())}`);
        assertArrayIncludes(generator.getFeedbackHistory(), [feedbackComment]);
        console.log(`✅ Draft regenerated successfully with valid feedback.`);
    });

    await t.step("Action: feedback - fails if no draft exists", async () => {
        console.log("\n--- Test: feedback - no draft ---");
        generator = new ConceptGenerator();
        mockLLM = new MockLLM();

        console.log("Attempting to provide feedback without a generated draft.");
        const result = await generator.feedback(mockLLM, "Improve this."); // Violates 'requires: draft exists'

        // Verify that an error is returned and no state changes
        assertEquals(typeof result, 'object');
        if (!('error' in result)) {
            console.error("❌ Expected an error, but no error was returned.");
            throw new Error("Expected an error for no draft.");
        }
        console.log(`Effect: Returns error. Expected: "No draft exists to provide feedback on.", Actual: "${result.error}"`);
        assertEquals(result.error, "No draft exists to provide feedback on.");

        console.log(`Effect: Draft remains empty. Expected: "", Actual: "${generator.getDraft()}"`);
        assertEquals(generator.getDraft(), "");
        console.log(`✅ Feedback failed as expected due to no existing draft.`);
    });

    await t.step("Action: feedback - fails if accepted", async () => {
        console.log("\n--- Test: feedback - accepted draft ---");
        generator = new ConceptGenerator();
        mockLLM = new MockLLM();
        mockLLM.setQuestionValidation(true);
        const draftContent = "Accepted draft content.";
        mockLLM.setDefaultResponse(draftContent);
        await generator.generate("Generate text.", mockLLM, []);
        generator.accept(); // Set draft to accepted

        console.log("Attempting to provide feedback on an accepted draft.");
        const result = await generator.feedback(mockLLM, "Improve this."); // Violates 'requires: draft has not yet been accepted'

        // Verify that an error is returned and state remains unchanged
        assertEquals(typeof result, 'object');
        if (!('error' in result)) {
            console.error("❌ Expected an error, but no error was returned.");
            throw new Error("Expected an error for accepted draft.");
        }
        console.log(`Effect: Returns error. Expected: "Cannot provide feedback on an accepted draft.", Actual: "${result.error}"`);
        assertEquals(result.error, "Cannot provide feedback on an accepted draft.");

        console.log(`Effect: Draft remains unchanged. Expected: "${draftContent}", Actual: "${generator.getDraft()}"`);
        assertEquals(generator.getDraft(), draftContent);
        console.log(`Effect: Accepted status remains true. Expected: true, Actual: ${generator.isAccepted()}`);
        assertEquals(generator.isAccepted(), true);
        console.log(`✅ Feedback failed as expected because the draft was already accepted.`);
    });

    await t.step("Action: feedback - fails with invalid feedback", async () => {
        console.log("\n--- Test: feedback - invalid feedback ---");
        generator = new ConceptGenerator();
        mockLLM = new MockLLM();
        mockLLM.setQuestionValidation(true);
        const initialDraftContent = "Some draft.";
        mockLLM.setDefaultResponse(initialDraftContent);
        await generator.generate("Generate text.", mockLLM, []);
        mockLLM.setFeedbackValidation(false); // Violates 'requires: feedback to be a valid feedback'
        const invalidFeedback = "What is your favorite color?";

        console.log(`Attempting to provide invalid feedback: "${invalidFeedback}". Mock LLM will deem feedback invalid.`);
        const result = await generator.feedback(mockLLM, invalidFeedback);

        // Verify that an error is returned and no state changes (other than error return)
        assertEquals(typeof result, 'object');
        if (!('error' in result)) {
            console.error("❌ Expected an error, but no error was returned.");
            throw new Error("Expected an error for invalid feedback.");
        }
        console.log(`Effect: Returns error. Expected: "Please submit valid actionable feedback.", Actual: "${result.error}"`);
        assertEquals(result.error, "Please submit valid actionable feedback.");

        console.log(`Effect: Draft remains unchanged. Expected: "${initialDraftContent}", Actual: "${generator.getDraft()}"`);
        assertEquals(generator.getDraft(), initialDraftContent);
        console.log(`Effect: Feedback history remains empty. Expected: 0 entries, Actual: ${generator.getFeedbackHistory().length} entries`);
        assertEquals(generator.getFeedbackHistory().length, 0);
        console.log(`✅ Feedback failed as expected due to invalid feedback.`);
    });

    // --- Principle Test ---
    await t.step("Principle: After generation, feedback regenerates output, or user edits/copies.", async () => {
        console.log("\n--- Principle Test: LLM Generation -> Feedback/Regeneration, or Edit, or Accept ---");
        // This test demonstrates the core workflow described in the principle:
        // 1. Initial generation of a draft.
        // 2. Then, the user can either provide feedback (leading to regeneration),
        // 3. Or edit the draft directly,
        // 4. Or accept the draft.

        // Setup for initial generation (common to all scenarios)
        const initialQuestion = "Draft a LinkedIn summary for a junior software developer.";
        const initialFiles: File[] = [{ name: "skills.txt", content: "JavaScript, TypeScript, React" }];
        const initialDraftContent = "This is the initial draft for a LinkedIn summary (v1).";

        // --- Scenario A: User provides feedback and output regenerates ---
        console.log("\nScenario A: User provides feedback, system regenerates.");
        generator = new ConceptGenerator();
        mockLLM = new MockLLM();
        mockLLM.setQuestionValidation(true);
        mockLLM.setFeedbackValidation(true);
        mockLLM.setDefaultResponse(initialDraftContent);

        console.log(`   Step A.1: Call generate action for question: "${initialQuestion}"`);
        const generateResultA = await generator.generate(initialQuestion, mockLLM, initialFiles);
        if ('error' in generateResultA) { throw new Error(`Generation failed: ${generateResultA.error}`); }
        assertEquals(generator.getDraft(), initialDraftContent, "Scenario A: Initial draft mismatch.");
        assertEquals(generator.isAccepted(), false, "Scenario A: Draft should not be accepted yet.");
        console.log(`     Initial draft generated: "${generator.getDraft()}"`);

        const feedbackComment = "Make it more engaging and highlight teamwork.";
        const regeneratedDraftContent = "This is the engaging and teamwork-focused summary (v2).";
        mockLLM.setRegeneratedResponse(regeneratedDraftContent); // Mock LLM's response for regeneration

        console.log(`   Step A.2: Call feedback action with comment: "${feedbackComment}"`);
        const feedbackResult = await generator.feedback(mockLLM, feedbackComment);
        if ('error' in feedbackResult) { throw new Error(`Feedback failed: ${feedbackResult.error}`); }
        assertEquals(generator.getDraft(), regeneratedDraftContent, "Scenario A: Draft should be regenerated.");
        assertArrayIncludes(generator.getFeedbackHistory(), [feedbackComment], "Scenario A: Feedback should be recorded.");
        assertEquals(generator.isAccepted(), false, "Scenario A: Draft should still not be accepted.");
        console.log(`     Draft regenerated based on feedback: "${generator.getDraft()}"`);
        console.log(`     Feedback history: ${JSON.stringify(generator.getFeedbackHistory())}`);
        console.log(`   Scenario A successfully demonstrated: Generate -> Feedback -> Regenerate.`);


        // --- Scenario B: User edits the draft ---
        console.log("\nScenario B: User edits the draft manually.");
        generator = new ConceptGenerator(); // New instance for independent scenario
        mockLLM = new MockLLM();
        mockLLM.setQuestionValidation(true);
        mockLLM.setDefaultResponse(initialDraftContent); // For initial generation
        const inferredFeedbackFromEdit = ["Refined wording."];
        mockLLM.setEditFeedbackResponse(JSON.stringify(inferredFeedbackFromEdit)); // Mock LLM inferring feedback from edit

        console.log(`   Step B.1: Call generate action for question: "${initialQuestion}"`);
        const generateResultB = await generator.generate(initialQuestion, mockLLM, initialFiles);
        if ('error' in generateResultB) { throw new Error(`Generation failed: ${generateResultB.error}`); }
        assertEquals(generator.getDraft(), initialDraftContent, "Scenario B: Initial draft mismatch.");
        console.log(`     Initial draft generated: "${generator.getDraft()}"`);

        const editedDraftContent = "This is the refined LinkedIn summary after user's manual edits (v2).";
        console.log(`   Step B.2: Call edit action with new draft: "${editedDraftContent}"`);
        const editResult = await generator.edit(mockLLM, editedDraftContent);
        if ('error' in editResult) { throw new Error(`Edit failed: ${editResult.error}`); }
        assertEquals(generator.getDraft(), editedDraftContent, "Scenario B: Draft should be updated by edit.");
        assertArrayIncludes(generator.getFeedbackHistory(), inferredFeedbackFromEdit, "Scenario B: Inferred feedback from edit should be recorded.");
        assertEquals(generator.isAccepted(), false, "Scenario B: Draft should still not be accepted.");
        console.log(`     Draft edited: "${generator.getDraft()}"`);
        console.log(`     Feedback history after edit: ${JSON.stringify(generator.getFeedbackHistory())}`);
        console.log(`   Scenario B successfully demonstrated: Generate -> Edit.`);


        // --- Scenario C: User accepts the draft ---
        console.log("\nScenario C: User accepts the draft.");
        generator = new ConceptGenerator(); // New instance for independent scenario
        mockLLM = new MockLLM();
        mockLLM.setQuestionValidation(true);
        mockLLM.setDefaultResponse(initialDraftContent); // For initial generation

        console.log(`   Step C.1: Call generate action for question: "${initialQuestion}"`);
        const generateResultC = await generator.generate(initialQuestion, mockLLM, initialFiles);
        if ('error' in generateResultC) { throw new Error(`Generation failed: ${generateResultC.error}`); }
        assertEquals(generator.getDraft(), initialDraftContent, "Scenario C: Initial draft mismatch.");
        console.log(`     Initial draft generated: "${generator.getDraft()}"`);

        console.log(`   Step C.2: Call accept action.`);
        const acceptResult = generator.accept();
        if ('error' in acceptResult) { throw new Error(`Acceptance failed: ${acceptResult.error}`); }
        assertEquals(generator.isAccepted(), true, "Scenario C: Draft should be accepted.");
        assertEquals(generator.getDraft(), initialDraftContent, "Scenario C: Accepted draft content should match original.");
        console.log(`     Draft accepted. Accepted status: ${generator.isAccepted()}`);
        console.log(`   Scenario C successfully demonstrated: Generate -> Accept.`);
    });
});
```