// file: src/UserAuthentication/UserAuthenticationConcept.ts
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "UserAuthentication" + ".";

/**
 * Type alias for the ID of a User.
 */
export type UserID = ID;

/**
 * Represents a user entry in the concept's state.
 *
 * A set of Users with
 *  a username of type String
 *  a password of type String
 */
export interface User {
  _id: UserID;
  username: string;
  // In a real application, passwords should be hashed and salted.
  // For this exercise, we store as plain string as per the spec.
  password: string; 
}

/**
 * @concept UserAuthentication
 * @purpose limit access to known users
 * @principle after a user registers with a username and a password,
 *            they can authenticate with that same username and password
 *            and be treated each time as the same user
 */
export default class UserAuthenticationConcept {
  private users: Collection<User>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
  }

    /**
     * Registers a new user with a unique username and password.
     *
     * @action register
     * @param {string} username - The desired username.
     * @param {string} password - The desired password.
     * @returns {{ user: User }} On successful registration, returns the new user.
     * @requires username does not exist already
     * @effects creates a new User with username and password
     */
    async register(
        { username, password }: { username: string; password: string },
    ): Promise<{ user: User }> {
        // Check if username already exists
        const existingUser = await this.users.findOne({ username });
        if (existingUser) {
            throw new Error("Username already exists");
        }

        // Create a new user
        const newUser: User = {
        _id: freshID() as UserID, // Generate a fresh ID for the new user
        username,
        password,
        };

        await this.users.insertOne(newUser);

        return { user: newUser };
    }

    /**
     * Authenticates a user by checking their username and password.
     *
     * @action authenticate
     * @param {string} username - The username provided for authentication.
     * @param {string} password - The password provided for authentication.
     * @returns {{ user: User }} On successful authentication, returns the ID of the authenticated user.
     * @requires user with username and password to exist
     * @effects returns user
     */
    async authenticate(
        { username, password }: { username: string, password: string },
    ): Promise<{ user: User }> {
        // Find a user that matches both username and password
        const authenticatedUser = await this.users.findOne({ username, password });

        if (authenticatedUser) {
            // Authentication successful, return the user's ID
            return { user: authenticatedUser };
        } else {
            // Authentication failed
            throw new Error("Invalid username or password");
        }
    }
}