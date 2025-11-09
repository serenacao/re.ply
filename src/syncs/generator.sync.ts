  
  
  import { Generator, Requesting } from "@concepts";
import { actions,  Sync } from "@engine";
import { verifyTokens } from "@utils/sync_utils.ts";



  export const UpdateInputRequest: Sync = ({
    request,
    files,
    token
  }) => ({
    // Triggered when a request to add a job is made
    when: actions([
      Requesting.request,
      { path: "/Generator/updateInput", files, token },
      { request },
    ]),
    
    // The where clause transforms incoming frames
   where: async (frames) => {
      console.log('frames', frames);
    // Pick the token from each frame
    const verified = await frames.queryAsync(
      // Function
      verifyTokens,
      // Input mapping: for each frame, map `token` param of verifyTokens to the frame's Symbol(token)
      { token: token  },
      // Output mapping: bind `userId` from verifyTokens output to a new symbol in frame
      { userId: Symbol("userId") }
    );
    console.log('verified user', verified)
    return verified;
  },
  
    // The then clause runs once we have userId bound
    then: actions([
      
      Generator.updateInput,
      {
        files,
        request,
      },
   
    ]),
  });
  
  export const UpdateInputResponse: Sync = ({ request }) => ({
    when: actions(
      [Requesting.request, { path: "/Generator/updateInput" }, { request }],
      [Generator.updateInput, {}, { }],
    ),
    then: actions([Requesting.respond, { request }]),
  });



export const GenerateRequest: Sync = ({
    request,
    question,
    files,
    token
  }) => ({
    // Triggered when a request to add a job is made
    when: actions([
      Requesting.request,
      { path: "/Generator/generate", question, files, token },
      { request },
    ]),
    
    // The where clause transforms incoming frames
   where: async (frames) => {
      console.log('frames', frames);
    // Pick the token from each frame
    const verified = await frames.queryAsync(
      // Function
      verifyTokens,
      // Input mapping: for each frame, map `token` param of verifyTokens to the frame's Symbol(token)
      { token: token  },
      // Output mapping: bind `userId` from verifyTokens output to a new symbol in frame
      { userId: Symbol("userId") }
    );
    console.log('verified user', verified)
    return verified;
  },
  
    // The then clause runs once we have userId bound
    then: actions([
      
      Generator.generate,
      {
        question,
        files,
        request,
      },
   
    ]),
  });
  
  export const GenerateResponse: Sync = ({ request, draft }) => ({
    when: actions(
      [Requesting.request, { path: "/Generator/generate" }, { request }],
      [Generator.generate, {}, { draft }],
    ),
    then: actions([Requesting.respond, { request, draft }]),
  });


  export const EditRequest: Sync = ({
    request,
    newDraft,
    token
  }) => ({
    // Triggered when a request to add a job is made
    when: actions([
      Requesting.request,
      { path: "/Generator/edit", newDraft, token },
      { request },
    ]),
    
    // The where clause transforms incoming frames
   where: async (frames) => {
      console.log('frames', frames);
    // Pick the token from each frame
    const verified = await frames.queryAsync(
      // Function
      verifyTokens,
      // Input mapping: for each frame, map `token` param of verifyTokens to the frame's Symbol(token)
      { token: token  },
      // Output mapping: bind `userId` from verifyTokens output to a new symbol in frame
      { userId: Symbol("userId") }
    );
    console.log('verified user', verified)
    return verified;
  },
  
    // The then clause runs once we have userId bound
    then: actions([
      
      Generator.edit,
      {
        newDraft,
        request,
      },
   
    ]),
  });
  
  export const EditResponse: Sync = ({ request, draft }) => ({
    when: actions(
      [Requesting.request, { path: "/Generator/edit" }, { request }],
      [Generator.edit, {}, { draft }],
    ),
    then: actions([Requesting.respond, { request, draft }]),
  });


export const FeedbackRequest: Sync = ({
    request,
    comment,
    token
  }) => ({
    // Triggered when a request to add a job is made
    when: actions([
      Requesting.request,
      { path: "/Generator/feedback", comment, token },
      { request },
    ]),
    
    // The where clause transforms incoming frames
   where: async (frames) => {
      console.log('frames', frames);
    // Pick the token from each frame
    const verified = await frames.queryAsync(
      // Function
      verifyTokens,
      // Input mapping: for each frame, map `token` param of verifyTokens to the frame's Symbol(token)
      { token: token  },
      // Output mapping: bind `userId` from verifyTokens output to a new symbol in frame
      { userId: Symbol("userId") }
    );
    console.log('verified user', verified)
    return verified;
  },
  
    // The then clause runs once we have userId bound
    then: actions([
      
      Generator.feedback,
      {
        comment,
        request,
      },
   
    ]),
  });
  
  export const FeedbackResponse: Sync = ({ request, draft }) => ({
    when: actions(
      [Requesting.request, { path: "/Generator/feedback" }, { request }],
      [Generator.feedback, {}, { draft }],
    ),
    then: actions([Requesting.respond, { request, draft }]),
  });
