import { userCollection } from "@db/schemas/user.schema.ts";
import { UserService } from "@features/auth/auth.service.ts";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import { tokenCollection } from "@db/schemas/token.schema.ts";
import { v4 as uuidv4 } from "uuid";
import { uuid } from "zod/mini";

let testID: string | ObjectId;
let testID1: ObjectId;
let refreshTokenRaw = "asldhgklha2350802lsd";
let refTokenMaxAge = 30 * 24 * 60 * 60 * 1000;

beforeAll(async () => {
  await userCollection.deleteMany({});

  try {
    const hashedPassword = await bcrypt.hash("123456789", 12);
    const testUser = await userCollection.insertOne({
      username: "testusername",
      password: hashedPassword,
      email: "test@test.com",
      created_at: new Date(),
      role: "user",
    });
    testID = testUser.insertedId;
  } catch (error: any) {
    if (error.errInfo) {
      console.error(
        "Validation Error Details:",
        JSON.stringify(error.errInfo.details),
      );
    }
    throw error;
  }
});

afterAll(async () => {
  await userCollection.deleteMany({});
});

describe("UserService - integrationTest", () => {
  it("should create a user", async () => {
    const user = await UserService.register({
      username: "johnUsername",
      password: "johny123456",
      email: "john@johny.com",
    });
    const findUser = await userCollection.findOne({
      username: user.username,
    });
    expect(findUser?._id).toBeDefined();
    testID1 = findUser?._id!;
  });

  it("should find user by id", async () => {
    const user = await UserService.findById(testID.toString());
    expect(user._id).toBeDefined;
  });

  it("should find userId by email", async () => {
    const userId = await UserService.findByEmail("test@test.com");
    expect(userId).toBeDefined();
  });

  it("should update password", async () => {
    const updateResult = await UserService.updatePassword(
      testID.toString(),
      "98765432",
    );
    expect(updateResult.modifiedCount).toEqual(1);
  });

  it("should be truthy when password matches", async () => {
    const result = await UserService.findByPassword(
      testID.toString(),
      "123456789",
    );
    expect(result).toBeTruthy;
  });

  it("should be falsy when password not matches", async () => {
    const result = await UserService.findByPassword(
      testID.toString(),
      "987654321",
    );
    expect(result).toBeFalsy;
  });

  it("should throw when updating password non-existent user", async () => {
    await expect(
      UserService.updatePassword("507f1f77bcf86cd799439011", "98765432"),
    ).rejects.toThrow("user no longer exists");
  });

  it("should throw when finding non-exsiting user with email", async () => {
    await expect(UserService.findByEmail("invalid@email.com")).rejects.toThrow(
      "no user found with this email",
    );
  });

  it("should throw when finding non-existent user", async () => {
    await expect(
      UserService.findById("507f1f77bcf86cd799439011"),
    ).rejects.toThrow("no user found");
  });

  it("should create ref token", async () => {
    const jti = uuidv4();
    await UserService.storeToken(
      jti,
      testID.toString(),
      refreshTokenRaw,
      refTokenMaxAge,
    );
    const token = await tokenCollection.findOne({
      userId: testID.toString(),
    });
    expect(token?.tokenHash).toBeDefined();
  });

  it("should throw when deleting non-existent user", async () => {
    await expect(
      UserService.deleteUser("507f1f77bcf86cd799439011"),
    ).rejects.toThrow("no user found to delete");
  });

  it("should delete user", async () => {
    const deletedUser = await UserService.deleteUser(testID.toString());
    expect(deletedUser.deletedCount).toEqual(1);
  });
});
