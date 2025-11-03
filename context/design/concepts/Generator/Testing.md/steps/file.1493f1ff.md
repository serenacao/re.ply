---
timestamp: 'Thu Oct 30 2025 00:04:22 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251030_000422.ed1b0fee.md]]'
content_id: 1493f1ff12c85602d205383e6d9f26d17a6aea1174d6e0385972d4f3830e2341
---

# file: src/conceptGenerator/conceptGeneratorConcept.test.ts

```typescript
import { assertEquals, assert, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ConceptGenerator, File, ILLM } from "./conceptGeneratorConcept.ts"; // Adjusted import to ConceptGenerator and ILLM

// --- Mock LLM Implementation for Testing ---
class MockLLM implements ILLM {
    private questionResponses: Map<string, boolean> = new Map();
    private feedbackResponses: Map<string, boolean> = new Map();
    private generatedText: string[] = []; // Queue of predefined generated texts
    private inferredFeedback: string[] = []; // Predefined inferred feedback for edits

    constructor(
        initialGeneratedText: string[] = ["Initial draft based on your question."],
        inferredFeedback: string[] = ['["Improved clarity"]']
    ) {
        this.generatedText = initialGeneratedText;
        this.inferredFeedback = inferredFeedback;
    }

    // Configure expected responses for isQuestion and isFeedback checks
    setQuestionResponse(question: string, isValid: boolean) {
        this.questionResponses.set(question, isValid);
    }

    setFeedbackResponse(feedback: string, isValid: boolean) {
        this.feedbackResponses.set(feedback, isValid);
    }

    // Add more generated text to the queue
    addGeneratedText(text: string) {
        this.generatedText.push(text);
    }

    // Add more inferred feedback to the queue
    addInferredFeedback(feedbackJson: string) {
        this.inferredFeedback.push(feedbackJson);
    }

    async executeLLM(prompt: string): Promise<string> {
        // console.log("MockLLM received prompt:", prompt.substring(0, 100) + "..."); // Debugging

        if (prompt.includes("Determine if the input is a message asking for help writing or improving materials related to a job")) {
            const inputMatch = prompt.match(/Input: "([^"]*)"/);
            const input = inputMatch ? inputMatch[1] : "";
            return this.questionResponses.get(input) ? "Yes" : "No";
        }
        if (prompt.includes("Determine if the input is a message giving feedback or instructions about how to improve a piece of writing.")) {
            const inputMatch = prompt.match(/Input: "([^"]*)"/);
            const input = inputMatch ? inputMatch[1] : "";
            return this.feedbackResponses.get(input) ? "Yes" : "No";
        }
        if (prompt.includes("You are an assistant that analyzes revisions to writing.")) {
            // Return predefined inferred feedback
            return this.inferredFeedback.shift() || '["Minor edit"]';
        }
        // For general generation, pop from the queue
        return this.generatedText.shift() || "Default generated response.";
    }
}

// --- Test Suite for ConceptGenerator ---
Deno.test("ConceptGenerator functionality", async (t) => {
    const [db, client] = await testDb(); // Database boilerplate as requested, though not used by Generator concept.

    Deno.test(t, "Action: generate - successful generation with valid question", async () => {
        console.log("\n--- Testing 'generate' action: successful generation ---");
        const mockLLM = new MockLLM(["Draft for LinkedIn summary."]);
        mockLLM.setQuestionResponse("Write a LinkedIn summary.", true);
        const generator = new ConceptGenerator();
        const files: File[] = [{ name: "profile.txt", content: "Experienced developer." }];

        console.log("  - Calling generate with a valid question...");
        const result = await generator.generate("Write a LinkedIn summary.", mockLLM, files);

        assert("draft" in result, "Expected 'draft' in result for successful generation.");
        assertEquals(result.draft, "Draft for LinkedIn summary.");
        assertEquals(generator.getDraft(), "Draft for LinkedIn summary.", "Effect: draft state updated.");
        assertEquals(generator.isAccepted(), false, "Effect: accepted status is FALSE.");
        assertEquals(generator.getFeedbackHistory().length, 0, "Effect: feedback history is cleared.");
        assertEquals(generator.getQuestionInput(), "Write a LinkedIn summary.", "Effect: question input is stored.");
        console.log("  ✅ Generated draft:", generator.getDraft());
    });

    Deno.test(t, "Action: generate - fails with invalid question", async () => {
        console.log("\n--- Testing 'generate' action: invalid question ---");
        const mockLLM = new MockLLM();
        mockLLM.setQuestionResponse("What is 1+1?", false); // Invalid question
        const generator = new ConceptGenerator();
        const files: File[] = [];

        console.log("  - Calling generate with an invalid question...");
        const result = await generator.generate("What is 1+1?", mockLLM, files);

        assert("error" in result, "Expected 'error' in result for invalid question.");
        assertEquals(result.error, "The input is not a valid question.", "Requirement: invalid question prevents generation.");
        assertEquals(generator.getDraft(), "", "Effect: draft remains empty.");
        assertEquals(generator.isAccepted(), false, "Effect: accepted status remains FALSE.");
        console.log("  ❌ Generation failed as expected for invalid question.");
    });

    Deno.test(t, "Action: generate - fails if already accepted", async () => {
        console.log("\n--- Testing 'generate' action: fails if already accepted ---");
        const mockLLM = new MockLLM(["First draft."]);
        mockLLM.setQuestionResponse("Write a report.", true);
        const generator = new ConceptGenerator();
        await generator.generate("Write a report.", mockLLM, []);
        generator.accept(); // Accept the first draft

        console.log("  - Attempting to generate a new draft after accepting the previous one...");
        const result = await generator.generate("Write a second report.", mockLLM, []);

        assert("error" in result, "Expected 'error' when attempting to generate after acceptance.");
        assertEquals(result.error, "Cannot generate new draft after current draft has been accepted.", "Requirement: cannot generate if accepted.");
        console.log("  ❌ Generation failed as expected.");
    });

    Deno.test(t, "Action: accept - successful acceptance", async () => {
        console.log("\n--- Testing 'accept' action: successful acceptance ---");
        const mockLLM = new MockLLM(["Final draft for approval."]);
        mockLLM.setQuestionResponse("Write a proposal.", true);
        const generator = new ConceptGenerator();
        await generator.generate("Write a proposal.", mockLLM, []);

        assertEquals(generator.isAccepted(), false, "Precondition: accepted status is initially FALSE.");
        console.log("  - Calling accept...");
        const result = generator.accept();

        assert("draft" in result, "Expected 'draft' in result for successful acceptance.");
        assertEquals(result.draft, "Final draft for approval.");
        assertEquals(generator.isAccepted(), true, "Effect: accepted status is TRUE.");
        console.log("  ✅ Draft accepted. Current status:", generator.isAccepted());
    });

    Deno.test(t, "Action: accept - fails if no draft exists", async () => {
        console.log("\n--- Testing 'accept' action: no draft exists ---");
        const generator = new ConceptGenerator();

        console.log("  - Calling accept when no draft has been generated...");
        const result = generator.accept();

        assert("error" in result, "Expected 'error' when no draft exists.");
        assertEquals(result.error, "No question or draft exists to accept.", "Requirement: question must exist.");
        assertEquals(generator.isAccepted(), false, "Effect: accepted status remains FALSE.");
        console.log("  ❌ Acceptance failed as expected.");
    });

    Deno.test(t, "Action: accept - fails if already accepted", async () => {
        console.log("\n--- Testing 'accept' action: already accepted ---");
        const mockLLM = new MockLLM(["Already accepted content."]);
        mockLLM.setQuestionResponse("Create a blog post.", true);
        const generator = new ConceptGenerator();
        await generator.generate("Create a blog post.", mockLLM, []);
        generator.accept(); // Initial acceptance

        assertEquals(generator.isAccepted(), true, "Precondition: accepted status is TRUE.");
        console.log("  - Calling accept again on an already accepted draft...");
        const result = generator.accept();

        assert("error" in result, "Expected 'error' when attempting to accept an already accepted draft.");
        assertEquals(result.error, "Draft is already accepted.", "Requirement: draft status must not be accepted.");
        console.log("  ❌ Acceptance failed as expected.");
    });


    Deno.test(t, "Action: edit - successful edit", async () => {
        console.log("\n--- Testing 'edit' action: successful edit ---");
        const mockLLM = new MockLLM(["Initial text."], ['["Made more concise"]']);
        mockLLM.setQuestionResponse("Write an email.", true);
        const generator = new ConceptGenerator();
        await generator.generate("Write an email.", mockLLM, []);
        const originalDraft = generator.getDraft();
        const newDraft = "Revised text for the email.";

        assertEquals(generator.isAccepted(), false, "Precondition: draft is not accepted.");
        assertEquals(originalDraft, "Initial text.", "Precondition: initial draft exists.");
        console.log("  - Original draft:", originalDraft);
        console.log("  - Calling edit with new draft:", newDraft);
        const result = await generator.edit(mockLLM, newDraft);

        assertEquals(Object.keys(result).length, 0, "Expected empty record for successful edit.");
        assertEquals(generator.getDraft(), newDraft, "Effect: draft replaced with newDraft.");
        assert(generator.getFeedbackHistory().includes("Made more concise"), "Effect: inferred feedback added to history.");
        console.log("  ✅ Draft edited. New draft:", generator.getDraft());
        console.log("  ✅ Feedback history:", generator.getFeedbackHistory());
    });

    Deno.test(t, "Action: edit - fails if no draft exists", async () => {
        console.log("\n--- Testing 'edit' action: no draft exists ---");
        const mockLLM = new MockLLM();
        const generator = new ConceptGenerator();

        console.log("  - Calling edit when no draft has been generated...");
        const result = await generator.edit(mockLLM, "Some new text.");

        assert("error" in result, "Expected 'error' when no draft exists.");
        assertEquals(result.error, "No draft exists to edit.", "Requirement: draft must exist.");
        assertEquals(generator.getDraft(), "", "Effect: draft remains empty.");
        console.log("  ❌ Edit failed as expected.");
    });

    Deno.test(t, "Action: edit - fails if draft is accepted", async () => {
        console.log("\n--- Testing 'edit' action: draft is accepted ---");
        const mockLLM = new MockLLM(["Accepted content."], ['["No change"]']);
        mockLLM.setQuestionResponse("Write a memo.", true);
        const generator = new ConceptGenerator();
        await generator.generate("Write a memo.", mockLLM, []);
        generator.accept();

        assertEquals(generator.isAccepted(), true, "Precondition: draft is accepted.");
        console.log("  - Calling edit on an accepted draft...");
        const result = await generator.edit(mockLLM, "New text for accepted memo.");

        assert("error" in result, "Expected 'error' when attempting to edit an accepted draft.");
        assertEquals(result.error, "Cannot edit an accepted draft.", "Requirement: draft status must not be accepted.");
        assertNotEquals(generator.getDraft(), "New text for accepted memo.", "Effect: draft should not change.");
        console.log("  ❌ Edit failed as expected.");
    });

    Deno.test(t, "Action: feedback - successful feedback and regeneration", async () => {
        console.log("\n--- Testing 'feedback' action: successful feedback ---");
        const mockLLM = new MockLLM(
            ["Initial project description."],
            []
        );
        mockLLM.setQuestionResponse("Describe Project X.", true);
        mockLLM.setFeedbackResponse("Make it more formal.", true);
        mockLLM.addGeneratedText("Revised project description, more formal."); // For regeneration

        const generator = new ConceptGenerator();
        await generator.generate("Describe Project X.", mockLLM, []);
        const originalDraft = generator.getDraft();

        assertEquals(generator.isAccepted(), false, "Precondition: draft is not accepted.");
        assertEquals(generator.getFeedbackHistory().length, 0, "Precondition: feedback history is empty.");
        console.log("  - Original draft:", originalDraft);
        console.log("  - Calling feedback with valid comment...");
        const result = await generator.feedback(mockLLM, "Make it more formal.");

        assert("draft" in result, "Expected 'draft' in result for successful feedback.");
        assertEquals(result.draft, "Revised project description, more formal.");
        assertEquals(generator.getDraft(), "Revised project description, more formal.", "Effect: draft updated after feedback.");
        assert(generator.getFeedbackHistory().includes("Make it more formal."), "Effect: feedback added to history.");
        console.log("  ✅ Feedback applied. New draft:", generator.getDraft());
        console.log("  ✅ Feedback history:", generator.getFeedbackHistory());
    });

    Deno.test(t, "Action: feedback - fails with invalid feedback", async () => {
        console.log("\n--- Testing 'feedback' action: invalid feedback ---");
        const mockLLM = new MockLLM(["Initial content."]);
        mockLLM.setQuestionResponse("Write a summary.", true);
        mockLLM.setFeedbackResponse("Hello there!", false); // Invalid feedback

        const generator = new ConceptGenerator();
        await generator.generate("Write a summary.", mockLLM, []);
        const originalDraft = generator.getDraft();
        const originalFeedbackHistoryLength = generator.getFeedbackHistory().length;

        assertEquals(originalDraft, "Initial content.", "Precondition: initial draft exists.");
        console.log("  - Calling feedback with invalid comment...");
        const result = await generator.feedback(mockLLM, "Hello there!");

        assert("error" in result, "Expected 'error' for invalid feedback.");
        assertEquals(result.error, "Please submit valid actionable feedback.", "Requirement: feedback must be valid.");
        assertEquals(generator.getDraft(), originalDraft, "Effect: draft remains unchanged.");
        assertEquals(generator.getFeedbackHistory().length, originalFeedbackHistoryLength, "Effect: feedback history remains unchanged.");
        console.log("  ❌ Feedback failed as expected.");
    });

    Deno.test(t, "Action: feedback - fails if no draft exists", async () => {
        console.log("\n--- Testing 'feedback' action: no draft exists ---");
        const mockLLM = new MockLLM();
        mockLLM.setFeedbackResponse("Improve tone.", true);
        const generator = new ConceptGenerator();

        console.log("  - Calling feedback when no draft has been generated...");
        const result = await generator.feedback(mockLLM, "Improve tone.");

        assert("error" in result, "Expected 'error' when no draft exists.");
        assertEquals(result.error, "No draft exists to provide feedback on.", "Requirement: draft must exist.");
        console.log("  ❌ Feedback failed as expected.");
    });

    Deno.test(t, "Action: feedback - fails if draft is accepted", async () => {
        console.log("\n--- Testing 'feedback' action: draft is accepted ---");
        const mockLLM = new MockLLM(["Accepted content."]);
        mockLLM.setQuestionResponse("Generate report.", true);
        mockLLM.setFeedbackResponse("Add more details.", true);
        const generator = new ConceptGenerator();
        await generator.generate("Generate report.", mockLLM, []);
        generator.accept();

        assertEquals(generator.isAccepted(), true, "Precondition: draft is accepted.");
        const originalDraft = generator.getDraft();
        const originalFeedbackHistoryLength = generator.getFeedbackHistory().length;
        console.log("  - Calling feedback on an accepted draft...");
        const result = await generator.feedback(mockLLM, "Add more details.");

        assert("error" in result, "Expected 'error' when attempting to feedback on an accepted draft.");
        assertEquals(result.error, "Cannot provide feedback on an accepted draft.", "Requirement: draft has not yet been accepted.");
        assertEquals(generator.getDraft(), originalDraft, "Effect: draft should not change.");
        assertEquals(generator.getFeedbackHistory().length, originalFeedbackHistoryLength, "Effect: feedback history should not change.");
        console.log("  ❌ Feedback failed as expected.");
    });


    Deno.test(t, "Principle trace: generate -> feedback -> edit -> accept", async () => {
        console.log("\n--- Testing Principle Trace: generate -> feedback -> edit -> accept ---");
        const mockLLM = new MockLLM(
            ["Initial draft for the cover letter."],
            ['["Rephrase the opening."]', '["Improved conciseness."]', '["Corrected grammar."]'] // Inferred for edits
        );
        mockLLM.addGeneratedText("Revised draft with a rephrased opening."); // For first feedback
        mockLLM.addGeneratedText("Final concise draft after editing."); // For second feedback

        mockLLM.setQuestionResponse("Write a cover letter for a software engineer position.", true);
        mockLLM.setFeedbackResponse("Make it more concise.", true);
        mockLLM.setFeedbackResponse("Check grammar.", true); // This will be used in a later step

        const generator = new ConceptGenerator();
        const files: File[] = [
            { name: "resume.pdf", content: "Skills: JavaScript, Python." },
            { name: "job_desc.txt", content: "Seeking experienced engineer." },
        ];

        console.log("1. Action: generate(question, llm, files)");
        const genResult1 = await generator.generate("Write a cover letter for a software engineer position.", mockLLM, files);
        assert("draft" in genResult1, "Expected draft from generation.");
        assertEquals(generator.getDraft(), "Initial draft for the cover letter.", "Trace: Initial draft generated.");
        assertEquals(generator.isAccepted(), false, "Trace: Not yet accepted.");
        assertEquals(generator.getFeedbackHistory().length, 0, "Trace: Feedback history is empty.");
        console.log("   Initial draft:", generator.getDraft());

        console.log("\n2. Action: feedback(llm, 'Make it more concise.')");
        const feedbackResult1 = await generator.feedback(mockLLM, "Make it more concise.");
        assert("draft" in feedbackResult1, "Expected draft from feedback.");
        assertEquals(generator.getDraft(), "Revised draft with a rephrased opening.", "Trace: Draft regenerated after feedback.");
        assertEquals(generator.getFeedbackHistory().length, 1, "Trace: Feedback added to history.");
        assert(generator.getFeedbackHistory().includes("Make it more concise."), "Trace: Specific feedback noted.");
        console.log("   Draft after feedback:", generator.getDraft());
        console.log("   Feedback history:", generator.getFeedbackHistory());

        console.log("\n3. Action: edit(llm, newDraft)");
        const editedDraft = "This is a much more concise and improved draft, with better flow.";
        const editResult = await generator.edit(mockLLM, editedDraft);
        assertEquals(Object.keys(editResult).length, 0, "Trace: Edit action successful.");
        assertEquals(generator.getDraft(), editedDraft, "Trace: Draft manually edited.");
        assertEquals(generator.getFeedbackHistory().length, 2, "Trace: Inferred feedback added for edit.");
        assert(generator.getFeedbackHistory().includes("Rephrase the opening."), "Trace: Inferred feedback is 'Rephrase the opening.'."); // From mock LLM queue
        console.log("   Draft after edit:", generator.getDraft());
        console.log("   Feedback history:", generator.getFeedbackHistory());


        console.log("\n4. Action: feedback(llm, 'Check grammar.')");
        const feedbackResult2 = await generator.feedback(mockLLM, "Check grammar.");
        assert("draft" in feedbackResult2, "Expected draft from feedback.");
        assertEquals(generator.getDraft(), "Final concise draft after editing.", "Trace: Draft regenerated again with updated content.");
        assertEquals(generator.getFeedbackHistory().length, 3, "Trace: Another feedback added to history.");
        assert(generator.getFeedbackHistory().includes("Check grammar."), "Trace: Specific feedback noted.");
        console.log("   Draft after second feedback:", generator.getDraft());
        console.log("   Feedback history:", generator.getFeedbackHistory());

        console.log("\n5. Action: accept()");
        const acceptResult = generator.accept();
        assert("draft" in acceptResult, "Expected draft from acceptance.");
        assertEquals(generator.isAccepted(), true, "Trace: Draft is now accepted.");
        assertEquals(generator.getDraft(), "Final concise draft after editing.", "Trace: Accepted draft matches final content.");
        console.log("   ✅ Draft accepted. Final accepted status:", generator.isAccepted());

        console.log("\nPrinciple fulfilled: LLM generated an answer, user provided feedback to regenerate, edited the draft, provided more feedback, and finally accepted it.");
    });

    await client.close(); // Close the database connection.
});
```
