import { ObjectId } from "mongodb";
import { userCollection } from "@db/schemas/user.schema.ts";
import * as Types from "@shared/types/types.ts";

export class UserClass {
  constructor(
    public username: string,
    public password: string,
    public email: string,
    public role: Types.UserRole,
    public _id?: string,
  ) {}

  static async create(data: Omit<UserClass, "_id">): Promise<UserClass> {
    const result = await userCollection.insertOne(data);

    return new UserClass(
      data.username,
      data.password,
      data.email,
      data.role,
      result.insertedId.toString(),
    );
  }

  static async delete(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("Invalid user id");
    await userCollection.deleteOne({ _id: new ObjectId(_id) });
  }

  static async findById(_id: string): Promise<UserClass> {
    if (!ObjectId.isValid(_id)) throw new Error("Invalid user id");
    const result = await userCollection.findOne({ _id: new ObjectId(_id) });
    if (!result) throw new Error("user id not found");
    return new UserClass(
      result.username,
      result.password,
      result.email,
      result.role,
      result._id.toString(),
    );
  }

  static async findByEmail(email: string) {
    const result = await userCollection.findOne({ email });
    if (!result) throw new Error("email not found");
    return result._id.toString();
  }

  static async updatePassword(_id: string, hashedPassword: string) {
    if (!ObjectId.isValid(_id)) throw new Error("Invalid user id");
    const result = await userCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { password: hashedPassword } },
    );
    if (result.matchedCount === 0) {
      throw new Error("user no longer exists");
    }
  }
}
