import { userCollection } from "@db/schemas/user.schema.ts";
import { UserClass } from "@features/auth/auth.model.ts";

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

describe("UserClass - integrationTest", () => {
  it("should create a user and be instance of UserClass", async () => {
    const user = await UserClass.create({
      username: "john",
      password: "johny123456",
      email: "john@johny.com",
      role: "user",
    });
    const findUser = await userCollection.findOne({ username: user.username });
    expect(findUser?._id).toBeDefined();
    expect(user).toBeInstanceOf(UserClass);
  });

  it("should find user by id", async () => {
    const user = await UserClass.findById(testID);
    expect(user._id).toBeDefined;
  });

  it("should find userId by email", async () => {
    const userId = await UserClass.findByEmail("test@test.com");
    expect(userId).toBeDefined();
  });

  it("should update password", async () => {
    const updateResult = await UserClass.updatePassword(testID, "98765432");
    expect(updateResult.modifiedCount).toEqual(1);
  });

  it("should throw when updating non-existent user", async () => {
    await expect(
      UserClass.updatePassword("507f1f77bcf86cd799439011", "98765432"),
    ).rejects.toThrow("user no longer exists");
  });

  it("should throw when finding non-exsiting user with email", async () => {
    await expect(UserClass.findByEmail("invalid@email.com")).rejects.toThrow(
      "no user found with this email",
    );
  });

  it("should throw when finding non-existent user", async () => {
    await expect(
      UserClass.findById("507f1f77bcf86cd799439011"),
    ).rejects.toThrow("no user found");
  });

  it("should throw when deleting non-existent user", async () => {
    await expect(UserClass.delete("507f1f77bcf86cd799439011")).rejects.toThrow(
      "no user found to delete",
    );
  });

  it("should delete user", async () => {
    const deletedUser = await UserClass.delete(testID);
    expect(deletedUser.deletedCount).toEqual(1);
  });
});
