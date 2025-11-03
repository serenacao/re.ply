---
timestamp: 'Wed Oct 29 2025 23:47:08 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251029_234708.11fc19fb.md]]'
content_id: 7916a11f58bc879a7aee709bbe958dadb06ca6db37f4cc093a19b98a366e467c
---

# file: src/concepts/GeneratorConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { ID, Empty } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { GeminiLLM } from '../gemini-llm.ts'; // Assuming GeminiLLM is in a specific location relative to the concept folder

// Declare collection prefix, use concept name
const PREFIX = "Generator" + ".";

// External generic types (e.g., for files if they were persistent entities handled by other concepts)
// For this concept, `File` is treated as a transient input type.
export interface File {
    name: string;
    content: string;
}

/**
 * Interface for the primary question document stored in MongoDB.
 * Corresponds to:
 *   - a question String
 *   - a draft String
 *   - an accepted Flag
 */
interface QuestionDoc {
    _id: ID; // Unique ID for this question/generation session
    question: string;
    draft: string;
    accepted: boolean;
}

/**
 * Interface for feedback history entries stored in MongoDB.
 * Corresponds to:
 *   - a set of feedbackHistory String
 */
interface FeedbackDoc {
    _id: ID; // Unique ID for each feedback entry
    questionId: ID; // Links feedback to its associated question
    feedbackText: string;
    timestamp: Date; // To maintain order of feedback if needed
}

export default class GeneratorConcept {
    // MongoDB collections to persist the concept's state
    private questions: Collection<QuestionDoc>;
    private feedbackHistory: Collection<FeedbackDoc>;

    constructor(private readonly db: Db) {
        this.questions = this.db.collection(PREFIX + "questions");
        this.feedbackHistory = this.db.collection(PREFIX + "feedbackHistory");

        // Optional: Ensure index on questionId for efficient feedback lookup
        // this.feedbackHistory.createIndex({ questionId: 1 });

        // Note: This concept assumes a single active question document managed by this instance.
        // For a multi-user or multi-session scenario, the `_id` of QuestionDoc would typically
        // incorporate a user ID or session ID, and actions would take these IDs as arguments.
        // For current simplicity, we operate on a single "active" document.
    }

    /**
     * Helper to retrieve the current active question document.
     * In a multi-user scenario, this would likely filter by a user ID.
     */
    private async getActiveQuestion(): Promise<QuestionDoc | null> {
        // Assuming there's either one or zero question documents for simplicity.
        // In a real app, you'd likely fetch by a user ID, session ID, or a specific concept instance ID.
        return await this.questions.findOne({});
    }

    /**
     * generate (question: String, llm: LLM, files: File[]): (draft: String)
     *
     * **requires** question is a valid question (as determined by LLM)
     *
     * **effects** generates a draft based on the question and files, stores it,
     *             sets accepted status to FALSE, and returns the generated draft.
     *             If a question already exists, it updates it; otherwise, it creates a new one.
     */
    async generate({ question, llm, files }: { question: string, llm: GeminiLLM, files: File[] }): Promise<{ draft?: string; error?: string }> {
        // Precondition: `question` is a valid question
        const isValidQuestion = await this.isQuestion(question, llm);
        if (!isValidQuestion) {
            return { error: 'The input is not a valid question for generation.' };
        }

        const existingQuestion = await this.getActiveQuestion();

        const prompt = this.createPrompt(question, files);
        const generatedDraft = await llm.executeLLM(prompt);

        if (existingQuestion) {
            // Update existing question document
            await this.questions.updateOne(
                { _id: existingQuestion._id },
                { $set: { question, draft: generatedDraft, accepted: false } }
            );
            // Clear feedback history for the old question if we're generating a new one
            await this.feedbackHistory.deleteMany({ questionId: existingQuestion._id });
        } else {
            // Insert new question document
            await this.questions.insertOne({
                _id: freshID(), // Generate a new ID for the main question document
                question,
                draft: generatedDraft,
                accepted: false,
            });
        }

        return { draft: generatedDraft };
    }

    /**
     * accept(): Empty
     *
     * **requires** an active question and draft exists, and draft status is not already accepted.
     *
     * **effects** sets the `accepted` status of the current draft to TRUE.
     */
    async accept(): Promise<Empty | { error: string }> {
        const activeQuestion = await this.getActiveQuestion();

        // Preconditions: question to exist and draft status is not accepted
        if (!activeQuestion) {
            return { error: 'No active question or draft found to accept.' };
        }
        if (activeQuestion.accepted) {
            return { error: 'The current draft is already accepted.' };
        }

        // Effects: set draft status to accepted
        await this.questions.updateOne(
            { _id: activeQuestion._id },
            { $set: { accepted: true } }
        );

        return {}; // Return Empty for success
    }

    /**
     * edit(llm: LLM, newDraft: String): Empty
     *
     * **requires** an active question and draft exists, and draft status is not accepted.
     *
     * **effects** replaces the current `draft` with `newDraft`, and automatically infers
     *             and adds new entries to `feedbackHistory` based on the changes.
     */
    async edit({ llm, newDraft }: { llm: GeminiLLM, newDraft: string }): Promise<Empty | { error: string }> {
        const activeQuestion = await this.getActiveQuestion();

        // Preconditions: draft status is not accepted, draft already exists
        if (!activeQuestion) {
            return { error: 'No active question or draft found to edit.' };
        }
        if (activeQuestion.accepted) {
            return { error: 'Cannot edit an already accepted draft.' };
        }
        if (activeQuestion.draft === newDraft) {
            return { error: 'New draft is identical to the current draft. No changes made.' };
        }

        const oldDraft = activeQuestion.draft;

        // Effects: replaces current draft with newDraft
        await this.questions.updateOne(
            { _id: activeQuestion._id },
            { $set: { draft: newDraft } }
        );

        // Effects: adds to feedback history (inferred from the edit)
        await this.updateFeedbackFromEdit(activeQuestion._id, llm, oldDraft, newDraft);

        return {}; // Return Empty for success
    }

    /**
     * feedback(llm: LLM, feedback: string): (draft: String)
     *
     * **requires** an active question and draft exists, feedback is valid (as determined by LLM),
     *             and the draft has not yet been accepted.
     *
     * **effects** adds the provided `feedback` to the `feedbackHistory`, then regenerates the
     *             `draft` using the LLM based on all accumulated feedback and the current draft.
     *             Returns the newly revised draft.
     */
    async feedback({ llm, feedback }: { llm: GeminiLLM, feedback: string }): Promise<{ draft?: string; error?: string }> {
        const activeQuestion = await this.getActiveQuestion();

        // Preconditions: draft has not yet been accepted, and active question/draft exist
        if (!activeQuestion) {
            return { error: 'No active question or draft found to provide feedback for.' };
        }
        if (activeQuestion.accepted) {
            return { error: 'Cannot provide feedback on an already accepted draft.' };
        }

        // Precondition: `feedback` is valid
        const isValidFeedback = await this.isFeedback(feedback, llm);
        if (!isValidFeedback) {
            return { error: 'Invalid or unactionable feedback provided.' };
        }

        // Effects: adds to feedback history
        await this.feedbackHistory.insertOne({
            _id: freshID(), // Unique ID for this feedback entry
            questionId: activeQuestion._id,
            feedbackText: feedback,
            timestamp: new Date(),
        });

        // Effects: generate new text with updated content based off all feedback so far
        const allFeedbackDocs = await this.feedbackHistory.find({ questionId: activeQuestion._id }).sort({ timestamp: 1 }).toArray();
        const allFeedbackTexts = allFeedbackDocs.map(f => f.feedbackText);

        const prompt = this.createFeedbackPrompt(allFeedbackTexts, activeQuestion.draft);
        const revisedDraft = await llm.executeLLM(prompt);

        await this.questions.updateOne(
            { _id: activeQuestion._id },
            { $set: { draft: revisedDraft } }
        );

        return { draft: revisedDraft };
    }

    // --- Private Helper Methods (LLM interaction and prompt construction) ---
    // These methods encapsulate LLM calls and prompt generation logic.
    // They are not exposed as actions or queries of the concept itself.

    private async isItem(prompt: string, llm: GeminiLLM): Promise<boolean> {
        const response = await llm.executeLLM(prompt);
        return response.trim().toLowerCase() === 'yes';
    }

    private async isQuestion(input: string, llm: GeminiLLM): Promise<boolean> {
        const prompt = `You are a strict text classifier.
        Determine if the input is a message asking for help writing or improving materials related to a job, internship, or professional application.
        Classify as "Yes" if the message:
        Asks for writing or editing help with any professional application or profile content, such as:
        cover letters
        answers to “why fit” or other application questions
        personal statements
        LinkedIn summaries, professional bios, or resumes
        other materials for jobs, internships, or professional profiles
        Mentions a company, position, or platform (e.g., LinkedIn) OR clearly refers to professional writing (e.g., “Draft a LinkedIn summary,” “Write my bio for work”)
        Classify as "No" if the message:
        Is unrelated to job or professional applications
        Asks a general question, performs math, or contains only numbers, greetings, or casual conversation
        Respond with exactly one word: Yes or No
        Do not include any explanations or reasoning.
        Input: "${input}"
        Answer:`;
        return this.isItem(prompt, llm);
    }

    private async isFeedback(input: string, llm: GeminiLLM): Promise<boolean> {
        const prompt = `You are a strict text classifier.
        Determine if the input is a message giving feedback or instructions about how to improve a piece of writing.
        Classify as "Yes" if the message:
        - Gives revision feedback, writing advice, or improvement instructions (e.g., "Make it more concise", "Improve the tone", "Add more detail about leadership").
        - Contains editing-related language such as revise, improve, clarify, shorten, reword, or adjust.
        - Could reasonably be interpreted as feedback on writing style, structure, or content.
        Classify as "No" if the message:
        - Is unrelated to writing feedback.
        - Asks a question, gives general information, or includes no feedback intent.
        Examples of "Yes":
        - "Make it more concise."
        - "Focus on leadership and impact."
        - "Revise the tone to sound more professional."
        - "Add a stronger conclusion."
        Examples of "No":
        - "Write me a cover letter."
        - "What is 1+1?"
        - "Hi there."
        - "Explain recursion."
        Respond with exactly one word: Yes or No.
        Do not include any explanations or reasoning.
        Input: "${input}"
        Answer:`;
        return this.isItem(prompt, llm);
    }

    private async updateFeedbackFromEdit(questionId: ID, llm: GeminiLLM, oldDraft: string, newDraft: string): Promise<void> {
        const prompt = `You are an assistant that analyzes revisions to writing.
        You will be given two drafts of text: Draft A (original) and Draft B (revised).
        Your task:
        1. Compare Draft A and Draft B.
        2. Identify what types of changes were made (e.g., tone, clarity, structure, word choice, level of detail, formatting, conciseness).
        3. Infer the possible feedback or instruction that caused those changes.
        4. Return the feedback as a Python list of short, actionable strings.
        5. Output only the Python list—no explanations, no extra text.
        Example:
        - If Draft A is casual and Draft B is more formal, the feedback might be: ["Write with a more professional tone."]
        - If Draft A rambles and Draft B is shorter, the feedback might be: ["Be more concise and remove unnecessary detail."]
        ---
        Draft A:
        ${oldDraft}
        Draft B:
        ${newDraft}
        Output:`;

        const text = await llm.executeLLM(prompt);

        try {
            const feedback: string[] = JSON.parse(text);
            if (Array.isArray(feedback)) {
                for (const fb of feedback) {
                    await this.feedbackHistory.insertOne({
                        _id: freshID(),
                        questionId: questionId,
                        feedbackText: fb,
                        timestamp: new Date(),
                    });
                }
            } else {
                console.error('❌ Parsed feedback from LLM inference is not an array:', feedback);
            }
        } catch (error) {
            console.error('❌ Error parsing feedback from LLM inference:', (error as Error).message);
        }
    }

    private createFeedbackPrompt(feedbackHistory: string[], currentDraft: string): string {
        let prompt = `The user has provided the following feedback on the draft:\n`;
        feedbackHistory.forEach((fb, index) => {
            prompt += `${index + 1}. ${fb}\n`;
        });
        prompt += `Please revise the draft accordingly.
        Rules:
            - Do NOT include greetings, explanations, or meta-commentary.
            - Output only the revised text.
            - Maintain the tone and style suitable for a professional job application.
        Current draft:\n${currentDraft}`; // Include current draft for LLM context
        return prompt;
    }

    private createPrompt(question: string, files: File[]): string {
        return `You are an expert job application writer. Use the following files as context:\n` +
            files.map(f => `File: ${f.name}\nContent: ${f.content}\n`).join('') +
            `\nUser question: "${question}".
            Instructions: Respond directly and only with the answer to the question. Do NOT include greetings, explanations, or extra commentary. Output only the requested text.
            `;
    }

    // --- Query actions (following the query signature guidelines) ---

    /**
     * _getDraft(): (draft: String)
     *
     * **requires** an active question exists
     *
     * **effects** returns the current draft in an array of dictionaries.
     */
    async _getDraft(): Promise<{ draft?: string; error?: string }[]> {
        const activeQuestion = await this.getActiveQuestion();
        if (!activeQuestion) {
            return [{ error: 'No active question found.' }];
        }
        return [{ draft: activeQuestion.draft }];
    }

    /**
     * _getFeedbackHistory(): (feedback: String)
     *
     * **requires** an active question exists
     *
     * **effects** returns all feedback associated with the current question in an array of dictionaries.
     */
    async _getFeedbackHistory(): Promise<{ feedback?: string; error?: string }[]> {
        const activeQuestion = await this.getActiveQuestion();
        if (!activeQuestion) {
            return [{ error: 'No active question found.' }];
        }
        const feedbackDocs = await this.feedbackHistory.find({ questionId: activeQuestion._id }).sort({ timestamp: 1 }).toArray();
        return feedbackDocs.map(f => ({ feedback: f.feedbackText }));
    }

    /**
     * _getAcceptedStatus(): (accepted: Boolean)
     *
     * **requires** an active question exists
     *
     * **effects** returns the accepted status of the current draft in an array of dictionaries.
     */
    async _getAcceptedStatus(): Promise<{ accepted?: boolean; error?: string }[]> {
        const activeQuestion = await this.getActiveQuestion();
        if (!activeQuestion) {
            return [{ error: 'No active question found.' }];
        }
        return [{ accepted: activeQuestion.accepted }];
    }

    /**
     * _getQuestionText(): (question: String)
     *
     * **requires** an active question exists
     *
     * **effects** returns the text of the current question.
     */
    async _getQuestionText(): Promise<{ question?: string; error?: string }[]> {
        const activeQuestion = await this.getActiveQuestion();
        if (!activeQuestion) {
            return [{ error: 'No active question found.' }];
        }
        return [{ question: activeQuestion.question }];
    }
}
```
