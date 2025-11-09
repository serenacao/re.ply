// /**
//  * Sample synchronizations: feel free to delete this entire file!
//  */

// import { JobTracker, Requesting } from "@concepts";
// import { actions, Sync } from "@engine";
// import { verifyTokens } from "@utils/sync_utils.ts";

// /**
//  * AddJobRequest
//  * - Receives a job add request with a JWT token.
//  * - Verifies the token to extract the userId.
//  * - If token is valid, adds a new job under that user.
//  */
// export const AddJobRequest: Sync = ({
//   request,
//   user,
//   position,
//   company,
//   status,
// }) => ({
//   // Triggered when a request to add a job is made
//   when: actions([
//     Requesting.request,
//     { path: "/api/JobTracker/add", user, position, company, status },
//     { request },
//   ]),

//   // The where clause transforms incoming frames
//   async where(frames) {
//     // Use queryAsync to call an async concept action
//     const verified = await frames.queryAsync(
//       verifyTokens,
//       { request },
//       { userId: Symbol("userId") },
//     );

//     // Now each frame has { userId } bound
//     return verified;
//   },

//   // The then clause runs once we have userId bound
//   then: actions([
//     JobTracker.add,
//     {
//       user: Symbol.for("userId"), // use the bound symbol from where()
//       position,
//       company,
//       status,
//     },
//   ]),
// });

// export const AddJobResponse: Sync = ({ request, job }) => ({
//   when: actions(
//     [Requesting.request, { path: "/api/JobTracker/add" }, { job }],
//     [JobTracker.add, {}, { job }],
//   ),
//   then: actions([Requesting.respond, { request, job }]),
// });

