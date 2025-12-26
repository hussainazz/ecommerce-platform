import { userCollection } from "@db/schemas/user.schema.ts";
import { UserService } from "@features/auth/auth.service.ts";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import { tokenCollection } from "@db/schemas/token.schema.ts";
import { v4 as uuidv4 } from "uuid";

// Helper function to create a test user
async function createTestUser(
  overrides: { username?: string; email?: string; password?: string } = {}
): Promise<string> {
  const password = overrides.password || "123456789";
  const hashedPassword = await bcrypt.hash(password, 12);
  const result = await userCollection.insertOne({
    username: overrides.username || `user_${uuidv4()}`,
    email: overrides.email || `test_${uuidv4()}@test.com`,
    password: hashedPassword,
    created_at: new Date(),
    role: "user",
  });
  return result.insertedId.toString();
}

function createTestToken() {
  const jti = uuidv4();
  const refreshTokenRaw = "someRefTokenString";
  const refTokenMaxAge = 3600 * 1000;
  return { jti, refreshTokenRaw, refTokenMaxAge };
}

describe("UserService - integrationTest", () => {
  // Clean up before running tests
  beforeEach(async () => {
    await userCollection.deleteMany({});
    await tokenCollection.deleteMany({});
  });

  afterAll(async () => {
    await userCollection.deleteMany({});
    await tokenCollection.deleteMany({});
  });

  it("should create a user", async () => {
    const userData = {
      username: "johnUsername",
      password: "johny123456",
      email: "john@johny.com",
    };
    const user = await UserService.register(userData);

    const findUser = await userCollection.findOne({
      username: userData.username,
    });
    expect(findUser).toBeDefined();
    expect(findUser?._id.toString()).toBe(user._id);
  });

  it("should find user by id", async () => {
    const userId = await createTestUser();
    const user = await UserService.findById(userId);
    expect(user._id).toBeDefined();
    expect(user._id).toBe(userId);
  });

  it("should find userId by email", async () => {
    const email = "unique@test.com";
    const userId = await createTestUser({ email });
    const foundUserId = await UserService.findIdByEmail(email);
    expect(foundUserId).toBeDefined();
    expect(foundUserId).toBe(userId);
  });

  it("should be truthy when password matches", async () => {
    const password = "mySecretPassword";
    const userId = await createTestUser({ password });

    const result = await UserService.findByPassword(userId, password);
    expect(result).toBeTruthy();
  });

  it("should update password", async () => {
    const userId = await createTestUser();
    const newPassword = "newPassword123";

    const updateResult = await UserService.updatePassword(userId, newPassword);
    expect(updateResult.modifiedCount).toEqual(1);

    // Verify the password was actually changed
    const updatedUser = await userCollection.findOne({ _id: new ObjectId(userId) });
    const isMatch = await bcrypt.compare(newPassword, updatedUser?.password || "");
    expect(isMatch).toBe(true);
  });

  it("should be falsy when password not matches", async () => {
    const userId = await createTestUser({ password: "correctPassword" });
    const result = await UserService.findByPassword(userId, "wrongPassword");
    expect(result).toBeFalsy();
  });

  it("should throw when updating password non-existent user", async () => {
    const nonExistentId = new ObjectId().toString();
    await expect(
      UserService.updatePassword(nonExistentId, "anyPassword")
    ).rejects.toThrow("user no longer exists");
  });

  it("should throw when finding non-exsiting user with email", async () => {
    await expect(UserService.findIdByEmail("nonexistent@email.com")).rejects.toThrow(
      "no user found with this email"
    );
  });

  it("should throw when finding non-existent user", async () => {
    const nonExistentId = new ObjectId().toString();
    await expect(
      UserService.findById(nonExistentId)
    ).rejects.toThrow("no user found");
  });

  it("should create ref token", async () => {
    const userId = await createTestUser();
    const { jti, refreshTokenRaw, refTokenMaxAge } = createTestToken();

    await UserService.storeToken(jti, userId, refreshTokenRaw, refTokenMaxAge);
    const token = await tokenCollection.findOne({ userId: new ObjectId(userId) });
    expect(token).toBeDefined();
    expect(token?.tokenHash).toBeDefined();
    expect(token?.jti).toBe(jti);
  })

  it("should find ref token", async () => {
    const userId = await createTestUser();
    const { jti, refreshTokenRaw, refTokenMaxAge } = createTestToken();

    await UserService.storeToken(jti, userId, refreshTokenRaw, refTokenMaxAge);

    const token = await UserService.findToken(jti);
    expect(token?.tokenHash).toBeDefined();
  })

  it("should return null when token not found", async () => {
    const token = await UserService.findToken("nonExistentJti");
    expect(token).toBeNull();
  })

  it("should return null when token expired", async () => {
    const userId = await createTestUser();
    const { jti, refreshTokenRaw, refTokenMaxAge } = createTestToken();

    const tokenHash = await bcrypt.hash(refreshTokenRaw, 12);

    const expires_at = new Date(Date.now() - 1000);
    const created_at = new Date(Date.now() - 1000 - refTokenMaxAge);

    console.log("test: ", expires_at)
    await tokenCollection.insertOne({
      jti,
      userId: new ObjectId(userId),
      tokenHash,
      expires_at,
      created_at
    });

    const token = await UserService.findToken(jti);
    expect(token).toBeNull();
  })

  it("should return null when token's user no longer exist", async () => {
    const { jti, refreshTokenRaw, refTokenMaxAge } = createTestToken();
    await tokenCollection.insertOne({
      jti,
      userId: new ObjectId(),
      tokenHash: await bcrypt.hash(refreshTokenRaw, 12),
      expires_at: new Date(Date.now() + refTokenMaxAge),
      created_at: new Date(Date.now())
    });
    await expect(UserService.findToken(jti)).rejects.toThrow("no user found");
  })

  it("should delete token", async () => {
    const { jti, refreshTokenRaw, refTokenMaxAge } = createTestToken();
    await tokenCollection.insertOne({
      jti,
      userId: new ObjectId(),
      tokenHash: await bcrypt.hash(refreshTokenRaw, 12),
      expires_at: new Date(Date.now() + refTokenMaxAge),
      created_at: new Date(Date.now())
    });

    const result = await UserService.deleteToken(jti);
    expect(result.deletedCount).toBe(1);
    const token = await tokenCollection.findOne({ jti });
    expect(token).toBeNull();
  });

  it("should return zero deletedCount when deleting non-existent token", async () => {
    const result = await UserService.deleteToken("non-existent-jti");
    expect(result.deletedCount).toBe(0);
  });

  it("should find userId by username", async () => {
    const username = "testuser123";
    const userId = await createTestUser({ username });
    const foundUserId = await UserService.findIdByUsername(username);
    expect(foundUserId).toBe(userId);
  });

  it("should throw when finding non-existent user by username", async () => {
    await expect(UserService.findIdByUsername("ghostUser")).rejects.toThrow(
      "no user found with this username"
    );
  });

  it("should throw on duplicate username", async () => {
    await userCollection.insertOne({
      username: "uniqueUsername",
      password: "uniquePassword",
      email: "test@Email.com",
      role: "user"
    })
    await expect(UserService.register({
      username: "uniqueUsername",
      password: "uniquePassword",
      email: "ts@Email.com",
    })).rejects.toThrow("duplicate username");
  })

  it("should throw on duplicate email", async () => {
    await userCollection.insertOne({
      username: "uniqueUsername",
      password: "uniquePassword",
      email: "unique@Email.com",
      role: "user"
    })
    await expect(UserService.register({
      username: "uniqueUsername2",
      password: "uniquePassword",
      email: "unique@Email.com",
    })).rejects.toThrow("duplicate email");
  })

  it("should throw when deleting non-existent user", async () => {
    const nonExistentId = new ObjectId().toString();
    await expect(
      UserService.deleteUser(nonExistentId)
    ).rejects.toThrow("no user found to delete");
  });

  it("should delete user", async () => {
    const userId = await createTestUser();
    const deletedUser = await UserService.deleteUser(userId);
    expect(deletedUser.deletedCount).toEqual(1);

    // Verify user is gone
    const foundUser = await userCollection.findOne({ _id: new ObjectId(userId) });
    expect(foundUser).toBeNull();
  });
});
