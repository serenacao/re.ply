import { JobTracker, Requesting } from "@concepts";
import { actions,  Sync } from "@engine";
import { verifyTokens } from "@utils/sync_utils.ts";


export const AddJobRequest: Sync = ({
  request,
  user,
  position,
  company,
  status,
  token
}) => ({
  // Triggered when a request to add a job is made
  when: actions([
    Requesting.request,
    { path: "/JobTracker/add", user, position, company, status, token },
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
    JobTracker.add,
    {
      user, // use the bound symbol from where()
      position,
      company,
      status,
    },
  ]),
});

export const AddJobResponse: Sync = ({ request, job }) => ({
  when: actions(
    [Requesting.request, { path: "/JobTracker/add" }, { request }],
    [JobTracker.add, {}, { job }],
  ),
  then: actions([Requesting.respond, { request, job }]),
});

export const GetJobRequest: Sync = ({
  request,
  user,
  token
}) => ({
  // Triggered when a request to add a job is made
  when: actions([
    Requesting.request,
    { path: "/JobTracker/getJobs", user, token },
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
    
    JobTracker.getJobs,
    {
      user, // use the bound symbol from where()
      request,
    },
 
  ]),
});

export const GetJobResponse: Sync = ({ request, jobs }) => ({
  when: actions(
    [Requesting.request, { path: "/JobTracker/getJobs" }, { request }],
    [JobTracker.getJobs, {}, { jobs }],
  ),
  then: actions([Requesting.respond, { request, jobs }]),
});

export const UpdateJobRequest: Sync = ({
  request,
  user,
  job,
  position,
  company,
  status,
  token
}) => ({
  // Triggered when a request to add a job is made
  when: actions([
    Requesting.request,
    { path: "/JobTracker/update", user, job, position, company, status, token },
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
    
    JobTracker.update,
    {
      user, // use the bound symbol from where()\
      job,
      position, 
      company,
      status,
      request,
    },
 
  ]),
});

export const UpdateJobResponse: Sync = ({ request, job }) => ({
  when: actions(
    [Requesting.request, { path: "/JobTracker/update" }, { request }],
    [JobTracker.update, {}, { job }],
  ),
  then: actions([Requesting.respond, { request, job }]),
});

export const RemoveJobRequest: Sync = ({
  request,
  user,
  job,
  token
}) => ({
  // Triggered when a request to add a job is made
  when: actions([
    Requesting.request,
    { path: "/JobTracker/remove", user, job, token },
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
    
    JobTracker.remove,
    {
      user, // use the bound symbol from where()\
      job,
      request,
    },
 
  ]),
});

export const RemoveJobResponse: Sync = ({ request, job }) => ({
  when: actions(
    [Requesting.request, { path: "/JobTracker/remove" }, { request }],
    [JobTracker.remove, {}, { job }],
  ),
  then: actions([Requesting.respond, { request, job }]),
});