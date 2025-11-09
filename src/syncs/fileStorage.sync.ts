
 import { FileStorage, Requesting } from "@concepts";
import { actions,  Sync } from "@engine";
import { verifyTokens } from "@utils/sync_utils.ts";

export const UploadRequest: Sync = ({
    request,
    user,
    name,
    content,
    token
  }) => ({
    // Triggered when a request to add a job is made
    when: actions([
      Requesting.request,
      { path: "/FileStorage/upload", user,
    name,
    content,token },
      { request },
    ]),
    
    // The where clause transforms incoming frames
   where: async (frames) => {
    // Pick the token from each frame
    const verified = await frames.queryAsync(
      // Function
      verifyTokens,
      // Input mapping: for each frame, map `token` param of verifyTokens to the frame's Symbol(token)
      { token: token  },
      // Output mapping: bind `userId` from verifyTokens output to a new symbol in frame
      { userId: Symbol("userId") }
    );

    return verified;
  },
  
    // The then clause runs once we have userId bound
    then: actions([
      
      FileStorage.upload,
      {
        user,
    name,
    content,
        request,
      },
   
    ]),
  });
  
  export const UploadResponse: Sync = ({ request, fileId }) => ({
    when: actions(
      [Requesting.request, { path: "/FileStorage/upload" }, { request }],
      [FileStorage.upload, {}, { fileId }],
    ),
    then: actions([Requesting.respond, { request, fileId }]),
  });


//  "/api/FileStorage/remove",

export const RemoveRequest: Sync = ({
    request,
    user,
    name,
    token
  }) => ({
    // Triggered when a request to add a job is made
    when: actions([
      Requesting.request,
      { path: "/FileStorage/remove", user,
    name,
   token },
      { request },
    ]),
    
    // The where clause transforms incoming frames
   where: async (frames) => {

    // Pick the token from each frame
    const verified = await frames.queryAsync(
      // Function
      verifyTokens,
      // Input mapping: for each frame, map `token` param of verifyTokens to the frame's Symbol(token)
      { token: token  },
      // Output mapping: bind `userId` from verifyTokens output to a new symbol in frame
      { userId: Symbol("userId") }
    );
 

    return verified;
  },
  
    // The then clause runs once we have userId bound
    then: actions([
      
      FileStorage.remove,
      {
        user,
    name,

        request,
      },
   
    ]),
  });
  
  export const RemoveResponse: Sync = ({ request, fileId }) => ({
    when: actions(
      [Requesting.request, { path: "/FileStorage/remove" }, { request }],
      [FileStorage.remove, {}, { fileId }],
    ),
    then: actions([Requesting.respond, { request, fileId }]),
  });


 // "/api/FileStorage/rename",
export const RenameRequest: Sync = ({
    request,
    user,
    name,
    newName,
    token
  }) => ({
    // Triggered when a request to add a job is made
    when: actions([
      Requesting.request,
      { path: "/FileStorage/rename", user,
    name,
    newName,token },
      { request },
    ]),
    
    // The where clause transforms incoming frames
   where: async (frames) => {

    // Pick the token from each frame
    const verified = await frames.queryAsync(
      // Function
      verifyTokens,
      // Input mapping: for each frame, map `token` param of verifyTokens to the frame's Symbol(token)
      { token: token  },
      // Output mapping: bind `userId` from verifyTokens output to a new symbol in frame
      { userId: Symbol("userId") }
    );
 
    
    return verified;
  },
  
    // The then clause runs once we have userId bound
    then: actions([
      
      FileStorage.rename,
      {
        user,
    name,
    newName,
        request,
      },
   
    ]),
  });
  
  export const RenameResponse: Sync = ({ request, fileId }) => ({
    when: actions(
      [Requesting.request, { path: "/FileStorage/rename" }, { request }],
      [FileStorage.rename, {}, { fileId }],
    ),
    then: actions([Requesting.respond, { request, fileId }]),
  });

 // "/api/FileStorage/files",

 export const FilesRequest: Sync = ({
    request,
    user,
    token
  }) => ({
    // Triggered when a request to add a job is made
    when: actions([
      Requesting.request,
      { path: "/FileStorage/files", user,
   token },
      { request },
    ]),
    
    // The where clause transforms incoming frames
   where: async (frames) => {
    // Pick the token from each frame
    const verified = await frames.queryAsync(
      // Function
      verifyTokens,
      // Input mapping: for each frame, map `token` param of verifyTokens to the frame's Symbol(token)
      { token: token  },
      // Output mapping: bind `userId` from verifyTokens output to a new symbol in frame
      { userId: Symbol("userId") }
    );
    return verified;
  },
  
    // The then clause runs once we have userId bound
    then: actions([
      
      FileStorage.files,
      {
        user,
        request,
      },
   
    ]),
  });
  
  export const FilesResponse: Sync = ({ request, files }) => ({
    when: actions(
      [Requesting.request, { path: "/FileStorage/files" }, { request }],
      [FileStorage.files, {}, { files }],
    ),
    then: actions([Requesting.respond, { request, files }]),
  });
