# Design Document: Re.ply — The Answer to Your Job Search

## Overview
Re.ply is a web application that streamlines the job application process by helping users generate, edit, and download high-quality responses for prompts such as cover letters or company-specific questions. Over the course of development, the design evolved significantly from the initial concept in Assignment 2 through the visual and implementation phases (Assignments 4a–4c).  
This document summarizes the key design changes, decisions, and refinements made throughout that evolution.

---

## 1. Major Design Evolutions

### New Concepts Added
- **JobTracker**  
  - **Purpose:** Added in Assignment 4a to let users track job applications, including position, company, and status.  
  - **Rationale:** Expands Re.ply from a single-purpose cover letter generator to a more complete job application management tool.  
  - **Impact:** Introduced a new data model and UI table, creating tighter integration between writing and application tracking.

- **UserAuthentication**  
  - **Purpose:** Enables users to log in, save progress, and secure uploaded files.  
  - **Rationale:** Since users handle personal data (resumes, company info), authentication became necessary.  
  - **Impact:** Required modifying the **FileStorage** concept to associate files with authenticated users, and later, to include time-sensitive access tokens.

---

### Concepts Modified
- **Generator**
  - **Initial Concept:** Included an `accept()` action to finalize drafts.  
  - **Final Design:** Removed `accept()` because it blocked further generations when multiple prompts were open.  
  - **Implementation Update (4c):** The Generator now takes the LLM as a constructor argument, improving modularity and reducing redundant API calls.

- **FileStorage**
  - **Initial Concept:** Handled generic file uploads and removals.  
  - **Final Design:** Expanded to manage user-associated files due to authentication changes.  
  - **Synchronization Update:** Generator now automatically updates context whenever the user adds or removes files.

- **PDFDownload**
  - **Initial Concept:** A dedicated concept for converting drafts to PDFs.  
  - **Final Design:** Removed after TA feedback (4a), as this function could be handled using an imported library rather than a custom ADT.  
  - **Impact:** Simplified architecture by offloading PDF logic to the frontend.

---

## 2. Visual & UX Design Changes

### Color, Typography, and Layout
- **Color Scheme:** Transitioned from Vue’s default purple to a custom palette aimed at creating a “cutesy” yet focused atmosphere.  
- **Typography:** Thinned the primary font to give a lighter, cleaner visual feel.  
- **Simplified Palette:** Reduced the number of accent colors to emphasize readability and flow between sections.  
- **PDF Page & Job Tracker Expansion (4b–4c):** Refined table layout and button spacing for better visual hierarchy.

### UX Improvements
- **File Uploader:** Still under refinement, but designed to make contextual file uploads feel approachable and visual.  
- **PDF Download Page:** Introduced as a separate page for clarity rather than embedding it within the chat.  
- **Interactive Chat Flow:** Optimized so users can iterate on feedback seamlessly without being blocked by previous state logic.

---

## 3. Functional Refinements

### System Synchronizations

| Synchronization | Description | Status |
|------------------|--------------|---------|
| `generatorUsesFileStorage` | Automatically updates Generator context after file uploads | Retained |
| `generatorRemovesFile` | Keeps Generator context consistent with removed files | Retained |
| `generatorFinalizedPDF` | Originally triggered after `accept()`; deprecated after removing `accept()` | Removed |

### Authentication Tokens
- Added in Assignment 4c to enhance security — tokens are time-sensitive, ensuring uploaded user data is valid only for an active session.

---

## 4. Summary of Key Differences

| Feature | Initial Design (A2) | Final Design (A4c) |
|----------|----------------------|--------------------|
| Cover Letter Generator | Draft, edit, and accept model | Streamlined regeneration, no accept state |
| PDF Download | Separate ADT | Handled via library |
| FileStorage | Local-only | User-scoped with auth integration |
| User Auth | None | Added full authentication + tokens |
| Job Tracker | None | Added for holistic job management |
| Visual Design | Default Vue purple | Custom palette + minimalist, soft style |
| Generator Backend | API passed each call | LLM injected in constructor |

---

## 5. Reflection
Re.ply began as a narrow tool for AI-assisted cover letter generation and evolved into a cohesive, user-centric platform for managing the entire job application process. Each design change prioritized **modularity**, **usability**, and **scalability**:
- Removing redundant concepts simplified the architecture.
- Adding authentication and job tracking made the product more realistic.
- Continuous UX refinements balanced productivity with visual approachability.

The final design better serves users seeking both personalization and efficiency in their job search workflow.
