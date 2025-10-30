import { Collection, Db } from "npm:mongodb";
import { ID, Empty } from "@utils/types.ts";
import { freshID } from "@utils/database.ts"; // Assuming freshID is correctly exported from here

// Declare collection prefix, use concept name
const PREFIX = "JobTracker" + ".";

// Generic types used by this concept
export type User = ID; // Represents an external user identifier

/**
 * Interface representing the structure of a job entry document in MongoDB.
 *
 * a set of Jobs
 *   a User (user)
 *   a position of type String
 *   a company of type String
 *   a status of type String
 */
export interface Job {
  user: User;   // The user who owns this job entry
  position: string;
  company: string;
  status: string; // E.g., "pending", "rejected", "accepted"
}

export default class JobTrackerConcept {
  // MongoDB collection to store job entries
  jobs: Collection<Job>;

  constructor(private readonly db: Db) {
    // Initialize the 'jobs' collection
    this.jobs = this.db.collection(PREFIX + "jobs");
  }

  /**
   * add(user: User, position: string, company: string, status: string): (Job)
   *
   * purpose: Allows a user to add a new job application to their tracker.
   *
   * requires: The pairing (position, company) must be unique for the given user.
   * effects: Creates a new Job entry with the specified details and returns its ID.
   * throws: An Error if a job with the same position and company already exists for the user,
   *         or if an unexpected database error occurs during insertion.
   */
  async add({ user, position, company, status }: { user: User; position: string; company: string; status: string }): Promise<{ job: Job }> {
    // --- Precondition Check (requires) ---
    // Check if a job with the same position and company already exists for this user.
    const existingJob = await this.jobs.findOne({
      user: user,
      position: position,
      company: company,
    });

    if (existingJob) {
      // If a duplicate is found, throw an error.
      throw new Error(`Job for position '${position}' at company '${company}' already exists for user '${user}'.`);
    }

    // Construct the new job entry document.
    const newJob: Job = {
      user: user,
      position: position,
      company: company,
      status: status,
    };

    // Insert the new job entry into the database.
    const result = await this.jobs.insertOne(newJob);

    if (result.acknowledged) {
      // If insertion is successful, return the newly created job.
      return { job: newJob };
    } else {
      // Handle unexpected database issues during insertion.
      throw new Error("Failed to add job due to an unexpected database error.");
    }
  }

  /**
   * remove(user: User, job: Job): (Job)
   *
   * purpose: Allows a user to remove a specific job application from their tracker.
   *
   * requires: The job must exist, and the job must be owned by the specified user.
   * effects: Removes the specified job from the set of tracked jobs and returns its ID.
   * throws: An Error if the job with the given ID is not found for the user,
   *         or if an unexpected database error occurs during deletion.
   */
  async remove({ user, job }: { user: User; job: Job }): Promise<{ job: Job }> {
    // Check that the job is owned by the requested user
    if (job.user !== user) {
        throw new Error(`Job not found for user '${user}' or not owned by them.`);
    }
    // --- Precondition Check (requires) ---
    // Find the job to ensure it exists
    const existingJob = await this.jobs.findOne({
      user: user,
      position: job.position,
      company: job.company,
    });
    if (!existingJob) {
      // If the job is not found or not owned by the user, throw an error.
      throw new Error(`Job not found for user '${user}' or not owned by them.`);
    }

    // --- Effects ---
    // Delete the job entry from the database.
    const result = await this.jobs.deleteOne(existingJob);

    if (result.deletedCount === 1) {
      // If successfully deleted, return the removed job.
      return { job: job };
    } else {
      // This case indicates a potential race condition or database issue after the findOne.
      throw new Error("Failed to remove job due to an unexpected database error.");
    }
  }

  /**
   * update(user: User, job: Job, position: string, company: string, status: string): (Job)
   *
   * purpose: Allows a user to update the details of an existing job application.
   *
   * requires: The job must exist, and the job must be owned by the specified user.
   * effects: Updates the position, company, and status fields of the specified job entry and returns its ID.
   * throws: An Error if the job with the given ID is not found for the user,
   *         or if an unexpected database error occurs during the update.
   */
  async update({ user, job, position, company, status }: { user: User; job: Job; position: string; company: string; status: string }): Promise<{ job: Job }> {
    // Check if the job is owned by requested user
    if (job.user !== user) {
        throw new Error(`Job not found for user '${user}' or not owned by them.`);
    }

    // --- Precondition Check (requires) ---
    // Ensure that the job exists under user
    const existingJob = await this.jobs.findOne({
      user: user,
      position: job.position,
      company: job.company,
    });
    if (!existingJob) {
      // If the job is not found or not owned by the user, throw an error.
      throw new Error(`Job not found for user '${user}' or not owned by them.`);
    }
    // Check that new job does not exist 
    const newJob = await this.jobs.findOne({
        user: user,
        position: position,
        company: company
    })

    if (newJob && existingJob && !newJob._id.equals(existingJob._id)) {
        throw new Error(`Job already exists!`);
    }

    // Note: The concept specification for 'update' does not explicitly include
    // the uniqueness constraint (position, company) per user, which is only
    // defined for 'add'. For this implementation, we strictly follow the
    // provided 'requires' for 'update' and do not re-check uniqueness here.
    // If such a constraint were desired on updates, it would need to be added
    // to the 'update' action's 'requires' clause in the concept spec.

    // --- Effects ---
    // Update the specified fields of the job entry.
    const result = await this.jobs.updateOne(
      existingJob,
      { $set: { position: position, company: company, status: status } },
    );
    
    if (result.modifiedCount === 1 || (result.matchedCount === 1 && result.modifiedCount === 0)) {
      // If the job was modified or if it matched but no actual change was needed (same data provided),
      // consider it a successful update and return the new job
      return {job: { user: user, position: position, company: company, status: status }};
    } else {
      // Handle cases where the job couldn't be updated (e.g., deleted by another process
      // between findOne and updateOne, though findOne should prevent most of this).
      throw new Error("Failed to update job due to an unexpected database error.");
    }
  }

  /**
   * _getJobsByUser({ user }: { user: User }): ({ jobs: JobEntry[] })
   *
   * purpose: Retrieves all job entries for a given user.
   * This is a query method, indicated by the leading underscore.
   *
   * effects: Returns an array of JobEntry objects associated with the user.
   */
  async getJobs({ user }: { user: User }): Promise<{ jobs: Job[] }> {
    const userJobs = await this.jobs.find({ user: user }).toArray();
    return { jobs: userJobs };
  }
}