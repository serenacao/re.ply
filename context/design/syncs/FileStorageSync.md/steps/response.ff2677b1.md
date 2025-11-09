---
timestamp: 'Thu Nov 06 2025 09:08:45 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_090845.21ab20dc.md]]'
content_id: ff2677b12b01fa55422a278ba44c67c24da57c56b9e1c8ab58fb68f3b66f9634
---

# response:

```typescript
// src/syncs/file_storage.sync.ts

// These two help you declare synchronizations
import { actions, Sync, Frames } from "@engine";

// Choose whatever concepts you have
// In a real project, these would be automatically generated or explicitly defined.
// For this example, we'll assume Requesting and FileStorage concepts exist
// with the specified actions/queries.
const Requesting = {
    request: Symbol("Requesting.request"),
    respond: Symbol("Requesting.respond"),
};

const FileStorage = {
    upload: Symbol("FileStorage.upload"),
    remove: Symbol("FileStorage.remove"),
    rename: Symbol("FileStorage.rename"),
    // The spec lists 'files', but the API doc and client code suggest a query,
    // hence the '_files' convention for queries returning multiple items.
    _files: Symbol("FileStorage._files"),
};

// Helper types for better readability if desired (not strictly required by DSL)
type User = symbol; // Representing an entity ID
type File = symbol; // Representing an entity ID

// === Synchronizations for FileStorage.upload ===

export const FileStorage_UploadRequest: Sync = ({ request, user, name, content }) => ({
    when: actions(
        [Requesting.request, { path: "/api/FileStorage/upload", user, name, content }, { request }],
    ),
    then: actions(
        [FileStorage.upload, { user, name, content }],
    ),
});

export const FileStorage_UploadResponse: Sync = ({ request, file }) => ({
    when: actions(
        [Requesting.request, { path: "/api/FileStorage/upload" }, { request }],
        [FileStorage.upload, {}, { file }], // Matches when FileStorage.upload successfully returns a 'file'
    ),
    then: actions(
        [Requesting.respond, { request, File: file }], // 'File' is the key in the response object
    ),
});

export const FileStorage_UploadError: Sync = ({ request, error }) => ({
    when: actions(
        [Requesting.request, { path: "/api/FileStorage/upload" }, { request }],
        [FileStorage.upload, {}, { error }], // Matches when FileStorage.upload returns an 'error'
    ),
    then: actions(
        [Requesting.respond, { request, error }],
    ),
});

// === Synchronizations for FileStorage.remove ===

export const FileStorage_RemoveRequest: Sync = ({ request, user, name }) => ({
    when: actions(
        [Requesting.request, { path: "/api/FileStorage/remove", user, name }, { request }],
    ),
    then: actions(
        [FileStorage.remove, { user, name }],
    ),
});

export const FileStorage_RemoveResponse: Sync = ({ request, file }) => ({
    when: actions(
        [Requesting.request, { path: "/api/FileStorage/remove" }, { request }],
        [FileStorage.remove, {}, { file }],
    ),
    then: actions(
        [Requesting.respond, { request, File: file }],
    ),
});

export const FileStorage_RemoveError: Sync = ({ request, error }) => ({
    when: actions(
        [Requesting.request, { path: "/api/FileStorage/remove" }, { request }],
        [FileStorage.remove, {}, { error }],
    ),
    then: actions(
        [Requesting.respond, { request, error }],
    ),
});

// === Synchronizations for FileStorage.rename ===
// Note: Assumed 'user' as an input parameter for rename for consistency
// with other actions and the state definition (file ownership).

export const FileStorage_RenameRequest: Sync = ({ request, user, name, newName }) => ({
    when: actions(
        [Requesting.request, { path: "/api/FileStorage/rename", user, name, newName }, { request }],
    ),
    then: actions(
        [FileStorage.rename, { user, name, newName }],
    ),
});

export const FileStorage_RenameResponse: Sync = ({ request, file }) => ({
    when: actions(
        [Requesting.request, { path: "/api/FileStorage/rename" }, { request }],
        [FileStorage.rename, {}, { file }],
    ),
    then: actions(
        [Requesting.respond, { request, File: file }],
    ),
});

export const FileStorage_RenameError: Sync = ({ request, error }) => ({
    when: actions(
        [Requesting.request, { path: "/api/FileStorage/rename" }, { request }],
        [FileStorage.rename, {}, { error }],
    ),
    then: actions(
        [Requesting.respond, { request, error }],
    ),
});

// === Synchronizations for FileStorage._files (Query) ===

export const FileStorage_GetFilesRequest: Sync = (
    { request, user, name, content, results }
) => ({
    when: actions(
        [Requesting.request, { path: "/api/FileStorage/_files", user }, { request }],
    ),
    where: async (frames) => {
        // Capture the original frame to ensure we can respond to the request even if no files are found.
        const originalFrame = frames[0];

        // Query the FileStorage concept for files belonging to the user.
        // We expect the query to return 'name' and 'content' for each file.
        frames = await frames.query(FileStorage._files, { user }, { name, content });

        // Handle the "zero matches" pitfall: if no files are found,
        // create a frame with an empty 'results' array to respond.
        if (frames.length === 0) {
            // Create a new frame including the original request binding and an empty results array.
            const responseFrame = { ...originalFrame, [results]: [] };
            return new Frames(responseFrame);
        }

        // Collect all found file 'name' and 'content' pairs into a 'results' array
        // grouped by the implicit non-collected variables (which should just be 'request' in this case).
        return frames.collectAs([name, content], results);
    },
    then: actions(
        [Requesting.respond, { request, results }],
    ),
});

// Note: For queries, explicit error handling in 'then' based on an 'error' output
// from the query itself is less common, as the `where` clause's `frames.query`
// typically throws an error that would be caught by the API layer before hitting syncs,
// or the query itself would implicitly return an empty set if no match.
// If an explicit error output for FileStorage._files was defined, a separate sync
// could be created similar to the action error syncs.
```
