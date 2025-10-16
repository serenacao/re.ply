---
timestamp: 'Thu Oct 16 2025 17:16:16 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_171616.1448897d.md]]'
content_id: 544b87c9353f9f049322b4dacb79ef2da28b62c21ffef923d20147f85cd6a91e
---

# response:

```typescript
// file: src/FileStorage/FileStorageConcept.test.ts
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
// Import FileDocument and FileID types from the concept for accurate type checking in tests
import FileStorageConcept, { FileDocument, FileID } from "./FileStorageConcept.ts";
import { ID } from "@utils/types.ts"; // Assuming @utils/types.ts exists and defines ID

Deno.test("FileStorageConcept", async (t) => {
  const [db, client] = await testDb();
  const concept = new FileStorageConcept(db);

  // Define specific user IDs for testing multi-user scenarios and independence
  const userAlice: ID = "user:Alice" as ID;
  const userBob: ID = "user:Bob" as ID;

  /**
   * Helper function to clean up all files for a given user.
   * Useful for ensuring a clean state for specific test steps, especially the principle test.
   */
  const deleteAllUserFiles = async (userId: ID) => {
    const files = await concept._files({ user: userId });
    for (const file of files) {
      await concept.remove({ user: userId, name: file.name });
    }
  };

  await t.step("should successfully upload a file for a user", async () => {
    // Ensure userAlice starts with no files for this specific test step
    await deleteAllUserFiles(userAlice);
    const initialFiles = await concept._files({ user: userAlice });
    assertEquals(initialFiles.length, 0);

    const fileName = "resume.pdf";
    const fileContent = "This is my resume content.";

    // Action: upload (includes user parameter)
    const uploadedFileID: FileID = await concept.upload({ user: userAlice, name: fileName, content: fileContent });

    // Verify effects: a file ID is returned
    assertEquals(typeof uploadedFileID, "string");

    // Verify state change using the _files query for userAlice
    const userAliceFiles = await concept._files({ user: userAlice });
    assertEquals(userAliceFiles.length, 1, "Should have 1 file after upload");
    assertEquals(userAliceFiles[0].userId, userAlice, "Should belong to Alice"); // Verify user association
    assertEquals(userAliceFiles[0].name, fileName, "Should have same file name");
    assertEquals(userAliceFiles[0].content, fileContent);
    assertEquals(userAliceFiles[0]._id, uploadedFileID);

    // Assert userBob has no files (demonstrates separation of concerns per user)
    const userBobFiles = await concept._files({ user: userBob });
    assertEquals(userBobFiles.length, 0);
  });

  await t.step("should prevent uploading a file with an existing name for the same user", async () => {
    // userAlice already has "resume.pdf" from previous test. Let's add another and then try to re-add it.
    const fileName = "report.docx";
    const fileContent1 = "First report content.";
    const fileContent2 = "Second report content.";

    // First upload for userAlice (expected to succeed)
    const uploadResult1: FileID = await concept.upload({ user: userAlice, name: fileName, content: fileContent1 });
    assertEquals(typeof uploadResult1, "string");

    // Second upload for userAlice with the same name (expected to fail due to requires)
    await assertRejects(
      async () => {
        await concept.upload({ user: userAlice, name: fileName, content: fileContent2 });
      },
      Error,
      `File with name '${fileName}' already exists for user '${userAlice}'.`, // Match specific error message
    );

    // Verify state for userAlice: only one file with `fileName` exists, and its content is from the first upload
    const userAliceFiles = await concept._files({ user: userAlice });
    assertEquals(userAliceFiles.length, 2); // resume.pdf (from previous test), plus report.docx
    const reportFile = userAliceFiles.find((f: FileDocument) => f.name === fileName);
    assertEquals(reportFile?.content, fileContent1); // Content should be from the first upload

    // Upload the same file name for a different user (userBob) should succeed
    const uploadResultForUserBob: FileID = await concept.upload({ user: userBob, name: fileName, content: fileContent2 });
    assertEquals(typeof uploadResultForUserBob, "string");
    const userBobFiles = await concept._files({ user: userBob });
    assertEquals(userBobFiles.length, 1);
    assertEquals(userBobFiles[0].name, fileName);
    assertEquals(userBobFiles[0].content, fileContent2);
    assertEquals(userBobFiles[0].userId, userBob);
  });

  await t.step("should successfully remove an existing file for a user", async () => {
    const fileName = "cover_letter.txt";
    const fileContent = "My cover letter.";
    // Upload a new file for userAlice to remove
    const fileToRemoveId = await concept.upload({ user: userAlice, name: fileName, content: fileContent });

    // Verify file exists for userAlice before removal
    let userAliceFilesBeforeRemove = await concept._files({ user: userAlice });
    assertEquals(userAliceFilesBeforeRemove.some((f: FileDocument) => f.name === fileName), true);
    assertEquals(userAliceFilesBeforeRemove.length, 3); // resume.pdf, report.docx, cover_letter.txt

    // Action: remove (includes user parameter)
    const removedFileID: FileID = await concept.remove({ user: userAlice, name: fileName });
    // Verify effects: file is removed and its ID is returned
    assertEquals(typeof removedFileID, "string");
    assertEquals(removedFileID, fileToRemoveId); // Ensure the correct ID is returned

    // Verify state change for userAlice: file is no longer present
    const userAliceFilesAfterRemove = await concept._files({ user: userAlice });
    assertEquals(userAliceFilesAfterRemove.some((f: FileDocument) => f.name === fileName), false);
    assertEquals(userAliceFilesAfterRemove.length, 2); // resume.pdf, report.docx remain
  });

  await t.step("should prevent removing a non-existent file for a user", async () => {
    const nonExistentFileName = "non_existent.jpg";
    await assertRejects(
      async () => {
        await concept.remove({ user: userAlice, name: nonExistentFileName });
      },
      Error,
      `File with name '${nonExistentFileName}' not found for user '${userAlice}'.`, // Match specific error message
    );

    // Verify state for userAlice: no change to existing files
    const userAliceFiles = await concept._files({ user: userAlice });
    assertEquals(userAliceFiles.length, 2); // Should still have resume.pdf and report.docx
  });

  await t.step("should successfully rename an existing file for a user", async () => {
    const originalName = "old_document.pdf";
    const newName = "new_document.pdf";
    const content = "Document content.";
    // Upload a new file for userAlice to rename
    const fileToRenameId = await concept.upload({ user: userAlice, name: originalName, content: content });

    // Verify file exists for userAlice with original name
    let userAliceFilesBeforeRename = await concept._files({ user: userAlice });
    assertEquals(userAliceFilesBeforeRename.some((f: FileDocument) => f.name === originalName), true);
    assertEquals(userAliceFilesBeforeRename.some((f: FileDocument) => f.name === newName), false);
    assertEquals(userAliceFilesBeforeRename.length, 3); // From previous tests + old_document.pdf

    // Action: rename (includes user parameter)
    const renamedFileID: FileID = await concept.rename({ user: userAlice, name: originalName, newName: newName });
    // Verify effects: file is renamed and its original ID is returned
    assertEquals(typeof renamedFileID, "string");
    assertEquals(renamedFileID, fileToRenameId); // The ID of the file itself should remain the same

    // Verify state change for userAlice: file now has new name
    const userAliceFilesAfterRename = await concept._files({ user: userAlice });
    assertEquals(userAliceFilesAfterRename.some((f: FileDocument) => f.name === originalName), false);
    assertEquals(userAliceFilesAfterRename.some((f: FileDocument) => f.name === newName), true);
    const renamedFile = userAliceFilesAfterRename.find((f: FileDocument) => f.name === newName);
    assertEquals(renamedFile?.content, content);
    assertEquals(renamedFile?._id, renamedFileID);
    assertEquals(renamedFile?.userId, userAlice);
    assertEquals(userAliceFilesAfterRename.length, 3); // Count remains the same
  });

  await t.step("should prevent renaming a non-existent file for a user", async () => {
    const nonExistentName = "missing.txt";
    const newName = "found.txt";
    await assertRejects(
      async () => {
        await concept.rename({ user: userAlice, name: nonExistentName, newName: newName });
      },
      Error,
      `File with name '${nonExistentName}' not found for user '${userAlice}'.`, // Match specific error message
    );

    // Verify state for userAlice: no change to existing files
    const userAliceFiles = await concept._files({ user: userAlice });
    assertEquals(userAliceFiles.length, 3); // resume.pdf, report.docx, new_document.pdf
  });

  await t.step("should prevent renaming a file to an already existing name for the same user", async () => {
    const fileToRename = "file_a.txt";
    const existingFile = "file_b.txt";
    await concept.upload({ user: userAlice, name: fileToRename, content: "Content A" });
    await concept.upload({ user: userAlice, name: existingFile, content: "Content B" });

    // Attempt to rename file_a.txt to file_b.txt for userAlice
    await assertRejects(
      async () => {
        await concept.rename({ user: userAlice, name: fileToRename, newName: existingFile });
      },
      Error,
      `File with new name '${existingFile}' already exists for user '${userAlice}'.`, // Match specific error message
    );

    // Verify state for userAlice: both files should still exist with their original names
    const userAliceFiles = await concept._files({ user: userAlice });
    assertEquals(userAliceFiles.some((f: FileDocument) => f.name === fileToRename), true);
    assertEquals(userAliceFiles.some((f: FileDocument) => f.name === existingFile), true);
    assertEquals(userAliceFiles.length, 5); // From previous tests + file_a.txt, file_b.txt
  });

  await t.step("should return all files for a specific user using the _files query", async () => {
    // Current state for userAlice should have 5 files
    const userAliceFiles = await concept._files({ user: userAlice });
    assertEquals(userAliceFiles.length, 5);
    assertEquals(userAliceFiles.map((f: FileDocument) => f.name).sort(), [
      "file_a.txt",
      "file_b.txt",
      "new_document.pdf",
      "report.docx",
      "resume.pdf",
    ].sort());

    // UserBob should still only have "report.docx" from earlier test
    const userBobFiles = await concept._files({ user: userBob });
    assertEquals(userBobFiles.length, 1);
    assertEquals(userBobFiles[0].name, "report.docx");
    assertEquals(userBobFiles[0].userId, userBob);
  });

  await t.step("principle: files provide context for generator and can be removed", async () => {
    // Ensure userAlice starts with a clean slate for the principle test scenario
    await deleteAllUserFiles(userAlice);
    let userAliceFiles = await concept._files({ user: userAlice });
    assertEquals(userAliceFiles.length, 0);

    const resumeName = "my_resume.json";
    const resumeContent = JSON.stringify({
      name: "Alice",
      skills: ["TypeScript", "MongoDB", "Concept Design"],
      experience: "5 years in software development",
    });

    // Trace Step 1: User uploads files (resume)
    const uploadedResumeID: FileID = await concept.upload({
      user: userAlice,
      name: resumeName,
      content: resumeContent,
    });
    assertEquals(typeof uploadedResumeID, "string");

    // Verify that the file is available (implicitly, a generator would query _files and use this content)
    let filesAfterUpload = await concept._files({ user: userAlice });
    assertEquals(filesAfterUpload.length, 1);
    assertEquals(filesAfterUpload[0].name, resumeName);
    assertEquals(filesAfterUpload[0].content, resumeContent);
    assertEquals(filesAfterUpload[0].userId, userAlice);

    // Trace Step 2: User chooses to remove files
    const removedResumeID: FileID = await concept.remove({ user: userAlice, name: resumeName });
    assertEquals(typeof removedResumeID, "string");
    assertEquals(removedResumeID, uploadedResumeID); // Should return the ID of the removed file

    // Verify that the file is no longer available (implicitly, a generator will no longer use it)
    const filesAfterRemove = await concept._files({ user: userAlice });
    assertEquals(filesAfterRemove.length, 0);
  });

  await client.close();
});
```
