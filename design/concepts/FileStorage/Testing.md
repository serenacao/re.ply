[@implementation](Implementation.md)

[@testing-concepts](../../background/testing-concepts.md)

# test: FileStorage

# response:

```typescript
// file: src/FileStorage/FileStorageConcept.test.ts
import { assertEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import FileStorageConcept from "./FileStorageConcept.ts";
import { ID } from "@utils/types.ts";

Deno.test("FileStorageConcept", async (t) => {
  const [db, client] = await testDb();
  const concept = new FileStorageConcept(db);

  await t.step("should successfully upload a file", async () => {
    const fileName = "resume.pdf";
    const fileContent = "This is my resume content.";
    const result = await concept.upload({ name: fileName, content: fileContent });

    // Verify effects: file is added and an ID is returned
    if ("error" in result) {
      throw new Error(`Upload failed: ${result.error}`);
    }
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
    if ("error" in uploadResult1) {
      throw new Error(`Initial upload failed: ${uploadResult1.error}`);
    }

    // Second upload with the same name (expected to fail due to requires)
    const uploadResult2 = await concept.upload({ name: fileName, content: fileContent2 });
    assertEquals("error" in uploadResult2, true);
    assertEquals(uploadResult2.error, `File with name '${fileName}' already exists.`);

    // Verify state: only one file exists
    const { files } = await concept._files();
    assertEquals(files.length, 2); // resume.pdf from previous test, plus report.docx
    const reportFile = files.find(f => f.name === fileName);
    assertEquals(reportFile?.content, fileContent1); // Content should be from the first upload
  });

  await t.step("should successfully remove an existing file", async () => {
    const fileName = "cover_letter.txt";
    const fileContent = "My cover letter.";
    await concept.upload({ name: fileName, content: fileContent });

    // Verify file exists before removal
    let { files: filesBeforeRemove } = await concept._files();
    assertEquals(filesBeforeRemove.some(f => f.name === fileName), true);

    const removeResult = await concept.remove({ name: fileName });
    // Verify effects: file is removed and its ID is returned
    if ("error" in removeResult) {
      throw new Error(`Remove failed: ${removeResult.error}`);
    }
    assertEquals(typeof removeResult.file, "string");

    // Verify state change: file is no longer present
    const { files: filesAfterRemove } = await concept._files();
    assertEquals(filesAfterRemove.some(f => f.name === fileName), false);
    assertEquals(filesAfterRemove.length, 2); // resume.pdf, report.docx remain
  });

  await t.step("should prevent removing a non-existent file", async () => {
    const nonExistentFileName = "non_existent.jpg";
    const removeResult = await concept.remove({ name: nonExistentFileName });

    // Verify requires: error is returned
    assertEquals("error" in removeResult, true);
    assertEquals(removeResult.error, `File with name '${nonExistentFileName}' not found.`);

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
    assertEquals(filesBeforeRename.some(f => f.name === originalName), true);
    assertEquals(filesBeforeRename.some(f => f.name === newName), false);

    const renameResult = await concept.rename({ name: originalName, newName: newName });
    // Verify effects: file is renamed and its ID is returned
    if ("error" in renameResult) {
      throw new Error(`Rename failed: ${renameResult.error}`);
    }
    assertEquals(typeof renameResult.file, "string");

    // Verify state change: file now has new name
    const { files: filesAfterRename } = await concept._files();
    assertEquals(filesAfterRename.some(f => f.name === originalName), false);
    assertEquals(filesAfterRename.some(f => f.name === newName), true);
    const renamedFile = filesAfterRename.find(f => f.name === newName);
    assertEquals(renamedFile?.content, content);
    assertEquals(renamedFile?._id, renameResult.file);
  });

  await t.step("should prevent renaming a non-existent file", async () => {
    const nonExistentName = "missing.txt";
    const newName = "found.txt";
    const renameResult = await concept.rename({ name: nonExistentName, newName: newName });

    // Verify requires: error is returned
    assertEquals("error" in renameResult, true);
    assertEquals(renameResult.error, `File with name '${nonExistentName}' not found.`);

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
    const renameResult = await concept.rename({
      name: fileToRename,
      newName: existingFile,
    });

    // Verify requires: error is returned
    assertEquals("error" in renameResult, true);
    assertEquals(renameResult.error, `File with new name '${existingFile}' already exists.`);

    // Verify state: both files should still exist with their original names
    const { files } = await concept._files();
    assertEquals(files.some(f => f.name === fileToRename), true);
    assertEquals(files.some(f => f.name === existingFile), true);
    assertEquals(files.length, 5); // From previous tests + file_a.txt, file_b.txt
  });

  await t.step("should return all files using the _files query", async () => {
    // Current state has 5 files (resume.pdf, report.docx, new_document.pdf, file_a.txt, file_b.txt)
    const { files } = await concept._files();
    assertEquals(files.length, 5);
    assertEquals(files.map(f => f.name).sort(), [
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
    if ("error" in uploadResult) {
      throw new Error(`Upload failed for principle test: ${uploadResult.error}`);
    }

    // Check if the file is available (generator can "utilize" it)
    let { files: afterUpload } = await concept._files();
    assertEquals(afterUpload.length, 1);
    assertEquals(afterUpload[0].name, resumeName);
    assertEquals(afterUpload[0].content, resumeContent);
    // Implicitly, a generator would query _files and use this content.

    // 2. User chooses to remove files
    const removeResult = await concept.remove({ name: resumeName });
    if ("error" in removeResult) {
      throw new Error(`Remove failed for principle test: ${removeResult.error}`);
    }

    // Check if the file is no longer available (generator will no longer use it)
    const { files: afterRemove } = await concept._files();
    assertEquals(afterRemove.length, 0);
  });

  await client.close();
});
```