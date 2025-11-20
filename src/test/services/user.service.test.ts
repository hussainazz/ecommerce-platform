import { userCollection } from "@db/schemas/user.schema.ts";
import { UserService } from "@features/auth/auth.service.ts";
import { ConnectionCheckOutStartedEvent, ObjectId } from "mongodb";

let testID: any;

beforeAll(async () => {
  await userCollection.deleteMany({});
  const testUser = await userCollection.insertOne({
    username: "test username",
    password: 123456789,
    email: "test@test.com",
    role: "user",
  });
  testID = testUser.insertedId.toString();
});

afterAll(async () => {
  await userCollection.deleteMany({});
});

describe("UserService - integrationTest", () => {
  it("should create a user", async () => {
    const user = await UserService.create({
      username: "john",
      password: "johny123456",
      email: "john@johny.com",
      role: "user",
    });
    const findUser = await userCollection.findOne({ username: user.username });
    expect(findUser?._id).toBeDefined();
  });

  it("should find user by id", async () => {
    const user = await UserService.findById(testID);
    expect(user._id).toBeDefined;
  });

  it("should find userId by email", async () => {
    const userId = await UserService.findByEmail("test@test.com");
    expect(userId).toBeDefined();
  });

  it("should update password", async () => {
    const updateResult = await UserService.updatePassword(testID, "98765432");
    expect(updateResult.modifiedCount).toEqual(1);
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
    const deletedUser = await UserService.delete(testID);
    expect(deletedUser.deletedCount).toEqual(1);
  });
});
