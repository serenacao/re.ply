---
timestamp: 'Thu Oct 16 2025 17:06:06 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_170606.d60708ac.md]]'
content_id: 487b17aa910965a40d344a67fc6589ea1c029276df7f2f47356730dbec3c9550
---

# response:

```typescript
// file: src/FileStorage/FileStorageConcept.ts
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts"; // Assuming @utils/types.ts exists and defines ID and Empty
import { freshID } from "@utils/database.ts"; // Assuming @utils/database.ts exists and defines freshID

// Declare collection prefix, use concept name
const PREFIX = "FileStorage" + ".";

// Generic types of this concept
type User = ID;
type FileID = ID; // Renaming File to FileID to avoid conflict with the interface name below

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
  ): Promise<{ file?: FileID; error?: string }> {
    // Check if a file with the same name already exists for this user
    const existingFile = await this.filesCollection.findOne({ userId: user, name: name });
    if (existingFile) {
      return { error: `File with name '${name}' already exists for user '${user}'.` };
    }

    const newFileId: FileID = freshID();
    const newFile: FileDocument = {
      _id: newFileId,
      userId: user,
      name: name,
      content: content,
    };

    await this.filesCollection.insertOne(newFile);
    return { file: newFileId };
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
  ): Promise<{ file?: FileID; error?: string }> {
    const existingFile = await this.filesCollection.findOne({ userId: user, name: name });
    if (!existingFile) {
      return { error: `File with name '${name}' not found for user '${user}'.` };
    }

    await this.filesCollection.deleteOne({ _id: existingFile._id });
    return { file: existingFile._id };
  }

  /**
   * Renames an existing file for a given user.
   *
   * @action rename (user: User, name: String, newName: String): (File)
   * @requires user exists (assumed), name does exist in user's Files, newName does not exist in user's Files
   * @effects replaces name with newName in user's Files
   */
  async rename(
    { user, name, newName }: { user: User; name: string; newName: string },
  ): Promise<{ file?: FileID; error?: string }> {
    // Check if the file to be renamed exists
    const fileToRename = await this.filesCollection.findOne({ userId: user, name: name });
    if (!fileToRename) {
      return { error: `File with name '${name}' not found for user '${user}'.` };
    }

    // Check if a file with the new name already exists for this user
    const existingNewNameFile = await this.filesCollection.findOne({ userId: user, name: newName });
    if (existingNewNameFile) {
      return { error: `File with new name '${newName}' already exists for user '${user}'.` };
    }

    await this.filesCollection.updateOne(
      { _id: fileToRename._id },
      { $set: { name: newName } },
    );
    return { file: fileToRename._id };
  }

  /**
   * Retrieves all files associated with a given user.
   *
   * @query _files (user: User): (Files[])
   * @requires user exists (assumed)
   * @effects return all Files under User
   */
  async _files({ user }: { user: User }): Promise<{ files: FileDocument[]; error?: string }> {
    const userFiles = await this.filesCollection.find({ userId: user }).toArray();
    return { files: userFiles };
  }
}
```
