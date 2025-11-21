import { userCollection } from "@db/schemas/user.schema.ts";
import { UserService } from "@features/auth/auth.service.ts";
import { hashPassword, verifyPassword } from "@features/auth/auth.service.ts";
import { ObjectId } from "mongodb";

let testID: string | ObjectId;
let testID1: ObjectId;
let refreshTokenRaw = "asldhgklha2350802lsd";
let refTokenMaxAge = 15 * 24 * 60 * 60 * 1000;

beforeAll(async () => {
  await userCollection.deleteMany({});
  const testUser = await userCollection.insertOne({
    username: "test username",
    password: await hashPassword("123456789"),
    email: "test@test.com",
    role: "user",
  });
  testID = testUser.insertedId;
});

afterAll(async () => {
  await userCollection.deleteMany({});
});

describe("UserService - integrationTest", () => {
  it("should create a user", async () => {
    const user = await UserService.register(
      {
        username: "john",
        password: "johny123456",
        email: "john@johny.com",
      },
      refreshTokenRaw,
      refTokenMaxAge,
    );
    const findUser = await userCollection.findOne({ username: user.username });
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

  it("should created refresh token on register", async () => {
    const user = await userCollection.findOne({ _id: testID1 });
    console.log(JSON.stringify(user, null, 2));
    expect(user?.refreshTokens[0].tokenHash).toBeDefined();
  });

  it("should push refresh token", async () => {
    await UserService.storeToken(testID1, refreshTokenRaw, refTokenMaxAge);
    const updatedUser = await userCollection.findOne({
      _id: testID1,
    });
    expect(updatedUser?.refreshTokens[1].tokenHash).toBeDefined();
  });

  it("should update password", async () => {
    const updateResult = await UserService.updatePassword(
      testID.toString(),
      "98765432",
    );
    expect(updateResult.modifiedCount).toEqual(1);
  });

  it("should be truthy when password matches", async () => {
    const result = await UserService.isPassMatch(
      testID.toString(),
      "123456789",
    );
    expect(result).toBeTruthy;
  });

  it("should be falsy when password not matches", async () => {
    const result = await UserService.isPassMatch(
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

  it("should throw when deleting non-existent user", async () => {
    await expect(
      UserService.delete("507f1f77bcf86cd799439011"),
    ).rejects.toThrow("no user found to delete");
  });

  it("should delete user", async () => {
    const deletedUser = await UserService.delete(testID.toString());
    expect(deletedUser.deletedCount).toEqual(1);
  });
});
