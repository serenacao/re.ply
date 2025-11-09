import { testDb } from "@utils/database.ts";
import UserAuthenticationConcept from "./UserAuthenticationConcept.ts";
<<<<<<< HEAD
import { assertEquals, assertRejects, assert } from "jsr:@std/assert";
import { assertEqual } from "../../engine/test/helpers.ts";
=======
import { assertEquals, assertRejects } from "jsr:@std/assert";
>>>>>>> 98a119c92660406502f9f66f8a4dc00091aafd48

Deno.test("UserAuthenticationConcept tests", async (t) => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);

  // Close the database client after all tests in this file are done.
  // The database itself is dropped by `testDb()` before each test file,
  // so no explicit `dropDatabase` is needed here.
   try {
  await t.step("register: successfully creates a new user", async () => {
    const username = "alice";
    const password = "password123";

    // Action: register(username, password)
    const { user: alice } = await concept.register({ username, password });
    const aliceId = alice._id;

    // Assert: A user ID is returned, fulfilling part of the 'effects'
    assertEquals(typeof aliceId, "string", "A user ID string should be returned.");
    console.log(`aliceId: ${aliceId}`);
    // assertEquals(aliceId.startsWith("user:"), true, "User ID should start with 'user:' prefix as per freshID convention.");

    // Verify Effect: The user was added to the database with correct details
    const storedUser = await db.collection("UserAuthentication.users").findOne({ _id: aliceId });
    assertEquals(storedUser?.username, username, "Stored user's username should match the registered one.");
    assertEquals(storedUser?.password, password, "Stored user's password should match the registered one.");
  });

  await t.step("register: prevents registration with existing username (requires)", async () => {
    const username = "bob";
    const password = "password456";

    // Pre-condition: First successful registration
    await concept.register({ username, password });

    // Assert Rejection: Attempt to register again with the same username should fail
    // This tests the 'requires: username does not exist already' condition.
    await assertRejects(
      () => concept.register({ username, password: "newpassword" }),
      Error,
      "Username already exists",
      "Should reject registration if the username already exists.",
    );
  });

  await t.step("authenticate: successfully authenticates an existing user (effects)", async () => {
    const username = "charlie";
    const password = "securepassword";

    // Pre-condition: User must be registered first
    const { user: charlie } = await concept.register({ username, password });
<<<<<<< HEAD
    
    // Action: authenticate(username, password)
    const { token: authenticatedCharlieToken } = await concept.authenticate({ username, password });
    const { userId : id} = await concept.verifyToken({token: authenticatedCharlieToken});

    // Assert Effect: The authenticated user ID matches the registered user ID
    // This confirms the 'effects: returns user' condition is met for a valid user.
    assert(authenticatedCharlieToken, "Token should not be null.");
    assertEqual(id, charlie._id, 'Ids should be equal');
=======
    const charlieId = charlie._id;
    
    // Action: authenticate(username, password)
    const { user: authenticatedCharlie } = await concept.authenticate({ username, password });
    const authenticatedCharlieId = authenticatedCharlie._id;

    // Assert Effect: The authenticated user ID matches the registered user ID
    // This confirms the 'effects: returns user' condition is met for a valid user.
    assertEquals(authenticatedCharlieId, charlieId, "Authenticated user ID should match the registered user's ID.");
>>>>>>> 98a119c92660406502f9f66f8a4dc00091aafd48
  });

  await t.step("authenticate: fails with incorrect password (requires)", async () => {
    const username = "diana";
    const password = "dianapass";

    // Pre-condition: User must be registered
    await concept.register({ username, password });

    // Assert Rejection: Attempt to authenticate with wrong password should fail
    // This tests the 'requires: user with username and password to exist' condition.
    await assertRejects(
      () => concept.authenticate({ username, password: "wrongpassword" }),
      Error,
      "Invalid username or password",
      "Should reject authentication if the password is incorrect.",
    );
  });

  await t.step("authenticate: fails with non-existent username (requires)", async () => {
    // Assert Rejection: Attempt to authenticate with a username that was never registered should fail
    // This also tests the 'requires: user with username and password to exist' condition.
    await assertRejects(
      () => concept.authenticate({ username: "nonexistent", password: "anypassword" }),
      Error,
      "Invalid username or password",
      "Should reject authentication if the username does not exist.",
    );
  });

  await t.step("Principle trace: User registration and subsequent authentication", async () => {
    // Principle: "after a user registers with a username and a password,
    //            they can authenticate with that same username and password
    //            and be treated each time as the same user"

    const username = "eve";
    const password = "evepass";

    // 1. Register a user (demonstrates 'register' action's purpose)
    console.log(`TRACE: Attempting to register user '${username}'...`);
    const { user: eve } = await concept.register({ username, password });
    const eveId = eve._id;
<<<<<<< HEAD
    assert(eveId, "Register action should return a valid token.");
=======
    assertEquals(typeof eveId, "string", "Register action should return a user ID.");
>>>>>>> 98a119c92660406502f9f66f8a4dc00091aafd48
    console.log(`TRACE: Successfully registered user Eve with ID: ${eveId}`);

    // 2. Authenticate with the same username and password (demonstrates 'authenticate' action's purpose)
    console.log(`TRACE: Attempting to authenticate user '${username}'...`);
<<<<<<< HEAD
    const { token: authenticatedEveToken } = await concept.authenticate({ username, password });
    assert(typeof authenticatedEveToken, "Authenticate action should return a token.");
    console.log(`TRACE: Successfully authenticated user Eve with username: ${username}`);

    // 3. Verify they are treated as the same user (IDs match, fulfilling "treated each time as the same user")
    const authenticatedEveId = await concept.verifyToken({ token: authenticatedEveToken })
    assertEquals(authenticatedEveId.userId, eveId, "Authenticated user ID should match registered user ID, proving 'same user' principle.");
    console.log("TRACE: Principle fulfilled: Eve successfully registered and authenticated as the same user.");
  });

  await t.step('closing connection', async () => {
    console.log("Closing MongoDB client...");
    await client.close();
    console.log("Closed successfully ✅");
  })
  } finally {
    console.log("Closing MongoDB client...");
    await client.close();
    console.log("Closed successfully ✅");
=======
    const { user: authenticatedEve } = await concept.authenticate({ username, password });
    const authenticatedEveId = authenticatedEve._id;
    assertEquals(typeof authenticatedEveId, "string", "Authenticate action should return a user ID.");
    console.log(`TRACE: Successfully authenticated user Eve with ID: ${authenticatedEveId}`);

    // 3. Verify they are treated as the same user (IDs match, fulfilling "treated each time as the same user")
    assertEquals(authenticatedEveId, eveId, "Authenticated user ID should match registered user ID, proving 'same user' principle.");
    console.log("TRACE: Principle fulfilled: Eve successfully registered and authenticated as the same user.");
  });
  } finally {
    await client.close();
>>>>>>> 98a119c92660406502f9f66f8a4dc00091aafd48
  }
});