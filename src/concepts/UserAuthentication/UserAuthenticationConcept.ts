// file: src/UserAuthentication/UserAuthenticationConcept.ts
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts"

// Declare collection prefix, use concept name
const PREFIX = "UserAuthentication" + ".";
const SECRET_WORD = Deno.env.get("SECRET_WORD") ?? "super_secret_word";
const SECRET_KEY = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(SECRET_WORD),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);


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
     * @effects returns a token that expires in 24 hours
     */
    async authenticate(
        { username, password }: { username: string, password: string },
    ): Promise<{ token: string }> {
        // Find a user that matches both username and password
        const authenticatedUser = await this.users.findOne({ username, password });

        if (!authenticatedUser) {
            throw new Error("Invalid username or password");
        }

        const token = await create({ alg: "HS256", typ: "JWT" }, {
        userId: authenticatedUser._id,
        exp: getNumericDate(60 * 60 * 24), // 24h expiration
        }, SECRET_KEY)

        return {token: token}

        // if (authenticatedUser) {
        //     // Authentication successful, return the user's ID
        //     return { user: authenticatedUser };
        // } else {
        //     // Authentication failed
        //     throw new Error("Invalid username or password");
        // }
    }

    /**
     * 
     * @param {string} token - The token provided for authentication
     * @returns {{token: string}}
     */
    async verifyToken({ token }: { token: string }): Promise<{ userId: UserID }> {
    try {
      const payload = await verify(token, SECRET_KEY)
      return {userId: payload.userId as UserID};
    } catch {
      throw new Error('Token is invalid!');
    }
  }
}