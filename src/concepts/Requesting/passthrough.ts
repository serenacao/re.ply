/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  // Feel free to delete these example inclusions
  "/api/Generator/isItem": "this is a private method, but also does not expose user info",
  "/api/Generator/isQuestion": "this is a private method, but also does not expose user info",
  "/api/Generator/isFeedback": "this is a private method, but also does not expose user info",
  "/api/Generator/regenerateWithFeedback": "is not user specific",
  "/api/Generator/updateFeedbackFromEdit": "is not user specific",
  "/api/Generator/createFeedbackPrompt": "does not expose internal user info",
  "/api/Generator/createPrompt": "is not user specific",
  "/api/Generator/getDraft": "does not expose user info",
  "/api/Generator/isAccepted": "does not expose user info",
  "/api/Generator/getFeedbackHistory": "does not expose user info",
  "/api/Generator/getquestion": "does not expose user info",
  "/api/UserAuthentication/register": "anyone should be allowed to register",
  "/api/UserAuthentication/authenticate": "anyone should be allowed to try to authenticate",
  "/api/UserAuthentication/verifyToken": "anyone can try to verify a token",
   "/api/llm/executeLLM": "endpoint is not openly available to public nor is it helpful",

};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  // Feel free to delete these example exclusions
  "/api/FileStorage/upload",
  "/api/FileStorage/remove",
  "/api/FileStorage/rename",
  "/api/FileStorage/files",
  "/api/Generator/updateInput",
  "/api/Generator/generate",
  "/api/Generator/edit",
  "/api/Generator/feedback",
  "/api/JobTracker/add",
  " /api/JobTracker/remove",
  "/api/JobTracker/update",
  "/api/JobTracker/getJobs",
];
