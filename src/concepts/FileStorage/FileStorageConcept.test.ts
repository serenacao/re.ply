import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import FileStorageConcept, { FileDocument } from "./FileStorageConcept.ts"; // Import FileDocument type
import { ID } from "@utils/types.ts";

Deno.test("FileStorageConcept", async (t) => {
  const [db, client] = await testDb();
  const concept = new FileStorageConcept(db);

  await t.step("should successfully upload a file", async () => {
    const fileName = "resume.pdf";
    const fileContent = "This is my resume content.";
    const result = await concept.upload({ name: fileName, content: fileContent });

    // Verify effects: file is added and an ID is returned
    const uploadedFileID = result.file;
    assertEquals(typeof uploadedFileID, "string");

    // Verify state change using _files query
    const { files } = await concept._files();
    assertEquals(files.length, 1);
    assertEquals(files[0].name, fileName);
    assertEquals(files[0].content, fileContent);
    assertEquals(files[0]._id, uploadedFileID);
  });

  await t.step("should prevent uploading a file with an existing name", async () => {
    const fileName = "report.docx";
    const fileContent1 = "First report content.";
    const fileContent2 = "Second report content.";

    // First upload (expected to succeed)
    const uploadResult1 = await concept.upload({ name: fileName, content: fileContent1 });
    assertEquals(typeof uploadResult1.file, "string"); // Expect a file ID to be returned

    // Second upload with the same name (expected to fail due to requires)
    await assertRejects(
      async () => {
        await concept.upload({ name: fileName, content: fileContent2 });
      },
      Error,
      "This file already exists", // Error message from the implementation
    );

    // Verify state: only one file with `fileName` exists, and its content is from the first upload
    const { files } = await concept._files();
    assertEquals(files.length, 2); // resume.pdf from previous test, plus report.docx
    const reportFile = files.find((f: FileDocument) => f.name === fileName);
    assertEquals(reportFile?.content, fileContent1); // Content should be from the first upload
  });

  await t.step("should successfully remove an existing file", async () => {
    const fileName = "cover_letter.txt";
    const fileContent = "My cover letter.";
    await concept.upload({ name: fileName, content: fileContent });

    // Verify file exists before removal
    let { files: filesBeforeRemove } = await concept._files();
    assertEquals(filesBeforeRemove.some((f: FileDocument) => f.name === fileName), true);

    const removeResult = await concept.remove({ name: fileName });
    // Verify effects: file is removed and its ID is returned
    assertEquals(typeof removeResult.file, "string");

    // Verify state change: file is no longer present
    const { files: filesAfterRemove } = await concept._files();
    assertEquals(filesAfterRemove.some((f: FileDocument) => f.name === fileName), false);
    assertEquals(filesAfterRemove.length, 2); // resume.pdf, report.docx remain
  });

  await t.step("should prevent removing a non-existent file", async () => {
    const nonExistentFileName = "non_existent.jpg";
    await assertRejects(
      async () => {
        await concept.remove({ name: nonExistentFileName });
      },
      Error,
      "File cannot be removed if it does not exist", // Error message from the implementation
    );

    // Verify state: no change to existing files
    const { files } = await concept._files();
    assertEquals(files.length, 2); // Should still have resume.pdf and report.docx
  });

  await t.step("should successfully rename an existing file", async () => {
    const originalName = "old_document.pdf";
    const newName = "new_document.pdf";
    const content = "Document content.";
    await concept.upload({ name: originalName, content: content });

    // Verify file exists with original name
    let { files: filesBeforeRename } = await concept._files();
    assertEquals(filesBeforeRename.some((f: FileDocument) => f.name === originalName), true);
    assertEquals(filesBeforeRename.some((f: FileDocument) => f.name === newName), false);

    const renameResult = await concept.rename({ name: originalName, newName: newName });
    // Verify effects: file is renamed and its ID is returned
    assertEquals(typeof renameResult.file, "string");

    // Verify state change: file now has new name
    const { files: filesAfterRename } = await concept._files();
    assertEquals(filesAfterRename.some((f: FileDocument) => f.name === originalName), false);
    assertEquals(filesAfterRename.some((f: FileDocument) => f.name === newName), true);
    const renamedFile = filesAfterRename.find((f: FileDocument) => f.name === newName);
    assertEquals(renamedFile?.content, content);
    assertEquals(renamedFile?._id, renameResult.file);
  });

  await t.step("should prevent renaming a non-existent file", async () => {
    const nonExistentName = "missing.txt";
    const newName = "found.txt";
    await assertRejects(
      async () => {
        await concept.rename({ name: nonExistentName, newName: newName });
      },
      Error,
      `File ${nonExistentName} does not exist`, // Error message from the implementation
    );

    // Verify state: no change to existing files
    const { files } = await concept._files();
    assertEquals(files.length, 3); // resume.pdf, report.docx, new_document.pdf
  });

  await t.step("should prevent renaming a file to an already existing name", async () => {
    const fileToRename = "file_a.txt";
    const existingFile = "file_b.txt";
    await concept.upload({ name: fileToRename, content: "Content A" });
    await concept.upload({ name: existingFile, content: "Content B" });

    // Attempt to rename file_a.txt to file_b.txt
    await assertRejects(
      async () => {
        await concept.rename({ name: fileToRename, newName: existingFile });
      },
      Error,
      `File ${existingFile} already exists`, // Error message from the implementation
    );

    // Verify state: both files should still exist with their original names
    const { files } = await concept._files();
    assertEquals(files.some((f: FileDocument) => f.name === fileToRename), true);
    assertEquals(files.some((f: FileDocument) => f.name === existingFile), true);
    assertEquals(files.length, 5); // From previous tests + file_a.txt, file_b.txt
  });

  await t.step("should return all files using the _files query", async () => {
    // Current state has 5 files (resume.pdf, report.docx, new_document.pdf, file_a.txt, file_b.txt)
    const { files } = await concept._files();
    assertEquals(files.length, 5);
    assertEquals(files.map((f: FileDocument) => f.name).sort(), [
      "file_a.txt",
      "file_b.txt",
      "new_document.pdf",
      "report.docx",
      "resume.pdf",
    ].sort());
  });

  await t.step("principle: files provide context for generator and can be removed", async () => {
    // Clear existing files for a clean principle test
    let { files: currentFiles } = await concept._files();
    for (const file of currentFiles) {
      // These removes should succeed as the files exist
      await concept.remove({ name: file.name });
    }
    currentFiles = (await concept._files()).files;
    assertEquals(currentFiles.length, 0);

    const resumeName = "my_resume.json";
    const resumeContent = JSON.stringify({
      name: "Alice",
      skills: ["TypeScript", "MongoDB", "Concept Design"],
    });

    // 1. User uploads files (resume)
    const uploadResult = await concept.upload({
      name: resumeName,
      content: resumeContent,
    });
    assertEquals(typeof uploadResult.file, "string");

    // Check if the file is available (generator can "utilize" it)
    let { files: afterUpload } = await concept._files();
    assertEquals(afterUpload.length, 1);
    assertEquals(afterUpload[0].name, resumeName);
    assertEquals(afterUpload[0].content, resumeContent);
    // Implicitly, a generator would query _files and use this content.

    // 2. User chooses to remove files
    const removeResult = await concept.remove({ name: resumeName });
    assertEquals(typeof removeResult.file, "string");

    // Check if the file is no longer available (generator will no longer use it)
    const { files: afterRemove } = await concept._files();
    assertEquals(afterRemove.length, 0);
  });

  await client.close();
});