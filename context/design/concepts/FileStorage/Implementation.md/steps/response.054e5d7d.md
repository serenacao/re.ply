---
timestamp: 'Sun Oct 12 2025 14:38:13 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_143813.25d9b716.md]]'
content_id: 054e5d7d36b42b3997d70555c5fe5fc7eb4542a34a1ec32e1671c1e790d4f88e
---

# response:

```typescript
// file: src/FileStorage/FileStorageConcept.ts
import { Collection, Db } from "npm:mongodb";
import { ID, Empty } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "FileStorage" + ".";

// Define the type for the File identifier, which is an external generic type ID
type FileID = ID;

/**
 * @concept FileStorage
 * @purpose stores files that the user would like the generator to have as context while generating an answer to their question, such as writing style, skills, etc
 *
 * @principle after a user uploads files, the output of the generator will utilize the information from the resume while answering the question/prompt, the user can also choose to remove files, and the generator will no longer use the information from that file
 */

/**
 * Represents a document in the 'files' collection.
 * Corresponds to "a set of Files with a name of type String, a content of type String".
 */
interface FileDocument {
  _id: FileID; // The unique identifier for the file
  name: string; // The name of the file
  content: string; // The content of the file
}

export default class FileStorageConcept {
  // MongoDB collection for storing file documents
  filesCollection: Collection<FileDocument>;

  constructor(private readonly db: Db) {
    this.filesCollection = this.db.collection(PREFIX + "files");
  }

  /**
   * @action upload
   * @requires name does not already exist in Files
   * @effects add new File to Files with name and content
   * @param {string} name - The name of the file to upload.
   * @param {string} content - The content of the file.
   * @returns {{file: FileID} | {error: string}} The ID of the newly uploaded file, or an error if a file with the same name already exists.
   */
  async upload(
    { name, content }: { name: string; content: string },
  ): Promise<{ file: FileID } | { error: string }> {
    // Check precondition: name does not already exist in Files
    const existingFile = await this.filesCollection.findOne({ name });
    if (existingFile) {
      return { error: `File with name '${name}' already exists.` };
    }

    // Effect: add new File to Files with name and content
    const newFileID = freshID();
    const newFile: FileDocument = {
      _id: newFileID,
      name,
      content,
    };
    await this.filesCollection.insertOne(newFile);

    return { file: newFileID };
  }

  /**
   * @action remove
   * @requires name does exist in Files
   * @effects remove file with name from Files
   * @param {string} name - The name of the file to remove.
   * @returns {{file: FileID} | {error: string}} The ID of the removed file, or an error if the file is not found.
   */
  async remove(
    { name }: { name: string },
  ): Promise<{ file: FileID } | { error: string }> {
    // Check precondition: name does exist in Files
    const existingFile = await this.filesCollection.findOne({ name });
    if (!existingFile) {
      return { error: `File with name '${name}' not found.` };
    }

    // Effect: remove file with name from Files
    await this.filesCollection.deleteOne({ _id: existingFile._id });

    return { file: existingFile._id };
  }

  /**
   * @action rename
   * @requires name does exist in Files, newName does not exist in Files
   * @effects replaces name with newName
   * @param {string} name - The current name of the file.
   * @param {string} newName - The new name for the file.
   * @returns {{file: FileID} | {error: string}} The ID of the renamed file, or an error if the original file is not found or the new name already exists.
   */
  async rename(
    { name, newName }: { name: string; newName: string },
  ): Promise<{ file: FileID } | { error: string }> {
    // Check precondition 1: name does exist in Files
    const existingFile = await this.filesCollection.findOne({ name });
    if (!existingFile) {
      return { error: `File with name '${name}' not found.` };
    }

    // Check precondition 2: newName does not exist in Files
    const existingNewNameFile = await this.filesCollection.findOne({
      name: newName,
    });
    if (existingNewNameFile) {
      return { error: `File with new name '${newName}' already exists.` };
    }

    // Effect: replaces name with newName
    await this.filesCollection.updateOne(
      { _id: existingFile._id },
      { $set: { name: newName } },
    );

    return { file: existingFile._id };
  }

  /**
   * @query _files
   * @effects return all Files
   * @returns {{files: FileDocument[]}} An array containing all stored file documents.
   */
  async _files(): Promise<{ files: FileDocument[] }> {
    // Effect: return all Files
    const allFiles = await this.filesCollection.find({}).toArray();
    return { files: allFiles };
  }
}
```
