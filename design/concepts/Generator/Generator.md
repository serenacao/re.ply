# concept Generator


- **purpose**: an interactive answer that can be generated and modified by an LLM and modified, accepted, and copied by a user through feedback

- **principle**: after the LLM generates answertype to the question, if there is user feedback, it will regenerate its output. Otherwise, the user can edit it or copy it for their use.

- state
    - a question String
    - a draft String
    - an accepted Flag
    - a set of feedbackHistory String
<<<<<<< HEAD
    - an llm LLM
=======
>>>>>>> 98a119c92660406502f9f66f8a4dc00091aafd48

- actions
    - updateInput(files: File[]): 
        - effect: updates files used to generate draft

<<<<<<< HEAD
    - async generate(question: String, files: File[]): (draft: String)
=======
    - async generate(question: String, llm: LLM, files: File[]): (draft: String)
>>>>>>> 98a119c92660406502f9f66f8a4dc00091aafd48
        - requires question is a valid question
        - effects generate a draft to the question using the files provided with accepted FALSE 

    - accept(): (draft: String)
        - requires question to exist and draft status is not accepted
        - effects set draft status to accepted

<<<<<<< HEAD
    - edit(newDraft: String):
        - requires draft status is not accepted, draft already exists 
        - effects replaces current draft with newDraft, adds to feedback history 

    - async feedback(feedback: string): (draft: String)
=======
    - edit(llm: LLM, newDraft: String):
        - requires draft status is not accepted, draft already exists 
        - effects replaces current draft with newDraft, adds to feedback history 

    - async feedback(llm: LLM, feedback: string): (draft: String)
>>>>>>> 98a119c92660406502f9f66f8a4dc00091aafd48
        - requires feedback to be a valid feedback for a draft, draft has not yet been accepted
        - effects adds to feedback history, generate new text with updated content based off all feedback so far and current files
