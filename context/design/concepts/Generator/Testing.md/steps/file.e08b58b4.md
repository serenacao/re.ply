---
timestamp: 'Thu Oct 30 2025 12:32:53 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251030_123253.541c0a3e.md]]'
content_id: e08b58b487d449da21a3043ac850cf6edacb61d0f5a9df8a210ba95236ce6fc5
---

# file: src/concepts/Generator/GeneratorConcept.ts

```typescript
import { Empty } from "@utils/types.ts";

export interface File {
    name: string;
    content: string;
}

// Define the LLM interface for mocking
export interface ILLM {
    executeLLM(prompt: string): Promise<string>;
}

export default class GeneratorConcept { // Renamed from GeneratorConcept to default export
    private question: string = "";
    private draft: string = "";
    private accepted: boolean = false;
    private feedbackHistory: string[] = [];
    private currentFiles: File[] = [];

    // Correctly use the injected LLM, assuming GeminiLLM implements ILLM
    constructor(private readonly llm: ILLM) {}

    /**
     * updateInput(files: File[]): Empty
     *
     * **effects** updates files used to generate draft
     */
    public updateInput(files: File[]): Empty {
        this.currentFiles = files;
        return {}; // Return empty dictionary as per concept design
    }

    /**
     * async generate(question: String, llm: LLM, files: File[]): (draft: String)
     *
     * **requires** question is a valid question
     *
     * **effects** generate a draft to the question using the files provided with accepted FALSE
     */
    async generate(question: string, llm: ILLM, files: File[]): Promise<{ draft: string }> {
        if (this.accepted) {
            throw new Error("Cannot generate new draft after current draft has been accepted.");
        }
        const isValidQuestion = await this.isQuestion(question, llm);
        if (!isValidQuestion) {
            throw new Error("The input is not a valid question.");
        }

        this.question = question;
        this.updateInput(files); // Ensure files are updated for subsequent operations

        const prompt = this.createPrompt(this.currentFiles);
        const text = await llm.executeLLM(prompt);

        this.draft = text;
        this.accepted = false; // Reset accepted status for a new generation
        this.feedbackHistory = []; // Clear feedback history for a new question
        return { draft: text }; // Return as dictionary
    }

    /**
     * accept(): (draft: String)
     *
     * **requires** question to exist and draft status is not accepted
     *
     * **effects** set draft status to accepted
     */
    accept(): { draft: string } {
        if (!this.question) {
            throw new Error("No question or draft exists to accept.");
        }
        if (this.accepted) {
            throw new Error("Draft is already accepted.");
        }
        this.accepted = true;
        return { draft: this.draft }; // Return as dictionary
    }

    /**
     * edit(llm: LLM, newDraft: String): (draft: String)
     *
     * **requires** draft status is not accepted, draft already exists
     *
     * **effects** replaces current draft with newDraft, adds to feedback history
     */
    async edit(llm: ILLM, newDraft: string): Promise<{ draft: string }> {
        if (!this.draft) {
            throw new Error("No draft exists to edit.");
        }
        if (this.accepted) {
            throw new Error("Cannot edit an accepted draft.");
        }

        const oldDraft = this.draft;
        // Inferred feedback is added to history
        await this.updateFeedbackFromEdit(llm, oldDraft, newDraft);

        this.draft = newDraft;
        return { draft: this.draft }; // Return as dictionary
    }

    /**
     * async feedback(llm: LLM, feedback: string): (draft: String)
     *
     * **requires** feedback to be a valid feedback for a draft, draft has not yet been accepted
     *
     * **effects** adds to feedback history, generate new text with updated content based off all feedback so far and current files
     */
    async feedback(llm: ILLM, comment: string): Promise<{ draft: string }> {
        if (!this.draft) {
            throw new Error("No draft exists to provide feedback on.");
        }
        if (this.accepted) {
            throw new Error("Cannot provide feedback on an accepted draft.");
        }
        const isValidFeedback = await this.isFeedback(comment, llm);
        if (!isValidFeedback) {
            throw new Error('Please submit valid actionable feedback.');
        }

        this.feedbackHistory.push(comment);
        const revised = await this.regenerateWithFeedback(llm);
        this.draft = revised;
        return { draft: this.draft }; // Return as dictionary
    }

    // --- Internal / Helper Methods (private) ---

    private async isItem(prompt: string, llm: ILLM): Promise<boolean> {
        const response = await llm.executeLLM(prompt);
        return response.trim().toLowerCase() === 'yes';
    }

    private async isQuestion(input: string, llm: ILLM): Promise<boolean> {
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

    private async isFeedback(input: string, llm: ILLM): Promise<boolean> {
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
        return this.isItem(
            prompt,
            llm);
    }

    private async regenerateWithFeedback(llm: ILLM): Promise<string> {
        let prompt = `The user has provided the following feedback on the draft:\n`;
        this.feedbackHistory.forEach((fb, index) => {
            prompt += `${index + 1}. ${fb}\n`;
        });
        prompt += `Please revise the following draft accordingly.
        Rules:
            - Do NOT include greetings, explanations, or meta-commentary.
            - Output only the revised text.
            - Maintain the tone and style suitable for a professional job application.
            - Incorporate the context from the files provided initially, if any.
        Current draft:\n` + this.draft;
        // console.log("--- Feedback Prompt ---");
        // console.log(prompt);
        // console.log("-----------------------");
        const revised = await llm.executeLLM(prompt);
        return revised;
    }

    private async updateFeedbackFromEdit(llm: ILLM, oldDraft: string, newDraft: string): Promise<void> {
        if (oldDraft === newDraft) {
            return;
        }
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
                this.feedbackHistory.push(...feedback);
            } else {
                // console.error('❌ Parsed feedback is not an array:', feedback);
            }
        } catch (error) {
            // console.error('❌ Error parsing feedback from LLM:', (error as Error).message);
        }

    }

    private createPrompt(files: File[]): string {
        return `You are an expert job application writer. Use the following files as context:\n` +
            files.map(f => `File: ${f.name}\nContent: ${f.content}\n`).join('') +
            `\nUser question: "${this.question}".
            Instructions: Respond directly and only with the answer to the question. Do NOT include greetings, explanations, or extra commentary. Output only the requested text.
            `;
    }

    // --- Getters for testing internal state ---
    public getDraft(): string {
        return this.draft;
    }

    public isAccepted(): boolean {
        return this.accepted;
    }

    public getFeedbackHistory(): string[] {
        return [...this.feedbackHistory]; // Return a copy
    }
    public getQuestion(): string { // Renamed for consistency
        return this.question;
    }
    public getCurrentFiles(): File[] {
        return [...this.currentFiles];
    }
}
```
