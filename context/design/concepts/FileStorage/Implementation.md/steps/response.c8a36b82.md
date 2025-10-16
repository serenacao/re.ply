---
timestamp: 'Thu Oct 16 2025 17:07:28 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_170728.e14fd617.md]]'
content_id: c8a36b82607071f38c3353ba2e9dec4af6bef888022f71f1e79e6f0746bbfde3
---

# response:

```typescript
// file: src/FileStorage/FileStorageConcept.ts
import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts"; // Assuming @utils/types.ts exists and defines ID
import { freshID } from "@utils/database.ts"; // Assuming @utils/database.ts exists and defines freshID

// Declare collection prefix, use concept name
const PREFIX = "FileStorage" + ".";

// Generic types of this concept
type User = ID;
type FileID = ID; // Renaming File to FileID to avoid conflict with the interface name below, as 'File' is also a browser API type.

/**
 * Interface representing a file stored by the concept.
 *
 * State:
 * a set of `Files` with
 *   a name of type `String`
 *   a content of type `String`
 *   a User (ID)
 */
interface FileDocument {
  _id: FileID; // Unique identifier for the file itself
  userId: User; // The user ID to whom this file belongs
  name: string; // The name of the file (e.g., "resume.txt")
  content: string; // The actual content of the file
}

/**
 * FileStorageConcept
 *
 * @concept FileStorage [User]
 * @purpose stores files that the user would like the generator to have as context
 *          while generating an answer to their question, such as writing style, skills, etc.
 * @principle after a user uploads files, the output of the generator will utilize the
 *            information from the resume while answering the question/prompt, the user can
 *            also choose to remove files, and the generator will no longer use the information
 *            from that file.
 */
export default class FileStorageConcept {
  private filesCollection: Collection<FileDocument>;

  constructor(private readonly db: Db) {
    this.filesCollection = this.db.collection<FileDocument>(PREFIX + "files");
  }

  /**
   * Uploads a new file for a given user.
   *
   * @action upload (user: User, name: String, content: String): (File)
   * @requires user exists (assumed by passing a User ID), name does not already exist in user's Files
   * @effects add new File to user's Files with name and content
   */
  async upload(
    { user, name, content }: { user: User; name: string; content: string },
  ): Promise<FileID> {
    // Requires: name does not already exist in user's Files
    const existingFile = await this.filesCollection.findOne({ userId: user, name: name });
    if (existingFile) {
      throw new Error(`File with name '${name}' already exists for user '${user}'.`);
    }

    const newFileId: FileID = freshID();
    const newFile: FileDocument = {
      _id: newFileId,
      userId: user,
      name: name,
      content: content,
    };

    await this.filesCollection.insertOne(newFile);
    return newFileId; // Effect: add new File to user's Files, return its ID
  }

  /**
   * Removes a file for a given user by its name.
   *
   * @action remove (user: User, name: String): (File)
   * @requires user exists (assumed), name does exist in user's Files
   * @effects remove file with name from user's Files
   */
  async remove(
    { user, name }: { user: User; name: string },
  ): Promise<FileID> {
    // Requires: name does exist in user's Files
    const existingFile = await this.filesCollection.findOne({ userId: user, name: name });
    if (!existingFile) {
      throw new Error(`File with name '${name}' not found for user '${user}'.`);
    }

    await this.filesCollection.deleteOne({ _id: existingFile._id });
    return existingFile._id; // Effect: remove file, return its ID
  }

  /**
   * Renames an existing file for a given user.
   *
   * Note: The original concept specification for 'rename' was missing the 'user' parameter.
   * It has been added here to ensure proper user-specific file management.
   *
   * @action rename (user: User, name: String, newName: String): (File)
   * @requires user exists (assumed), name does exist in user's Files, newName does not exist in user's Files
   * @effects replaces name with newName in user's Files
   */
  async rename(
    { user, name, newName }: { user: User; name: string; newName: string },
  ): Promise<FileID> {
    // Requires: name does exist in user's Files
    const fileToRename = await this.filesCollection.findOne({ userId: user, name: name });
    if (!fileToRename) {
      throw new Error(`File with name '${name}' not found for user '${user}'.`);
    }

    // Requires: newName does not exist in user's Files
    const existingNewNameFile = await this.filesCollection.findOne({ userId: user, name: newName });
    if (existingNewNameFile) {
      throw new Error(`File with new name '${newName}' already exists for user '${user}'.`);
    }

    await this.filesCollection.updateOne(
      { _id: fileToRename._id },
      { $set: { name: newName } },
    );
    return fileToRename._id; // Effect: replaces name with newName, return its ID
  }

  /**
   * Retrieves all files associated with a given user.
   *
   * @query _files (user: User): (Files[])
   * @requires user exists (assumed)
   * @effects return all Files under User
   */
  async _files({ user }: { user: User }): Promise<FileDocument[]> {
    // Requires: user exists (assumed) - no explicit check needed as per prompt's assumption,
    // an empty array will be returned if the user has no files or does not exist.
    const userFiles = await this.filesCollection.find({ userId: user }).toArray();
    return userFiles; // Effect: return all Files under User
  }
}
```
