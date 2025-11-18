import { ObjectId } from "mongodb";
import { userCollection } from "@db/schemas/user.schema.ts";
import * as Types from "@shared/types/types.ts";

export class UserService {
  static async create(data: Omit<Types.User, "_id">): Promise<Types.User> {
    const result = await userCollection.insertOne(data);
    return {
      _id: result.insertedId.toString(),
      username: data.username,
      password: data.password,
      email: data.email,
      role: data.role,
    };
  }

  static async delete(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("Invalid user id");
    const result = await userCollection.deleteOne({ _id: new ObjectId(_id) });
    if (result.deletedCount !== 1) throw new Error("no user found to delete");
    return result;
  }

  static async findById(_id: string): Promise<Types.User> {
    if (!ObjectId.isValid(_id)) throw new Error("Invalid user id");
    const result = await userCollection.findOne({ _id: new ObjectId(_id) });
    if (!result) throw new Error("no user found");
    return {
      _id: result._id.toString(),
      username: result.username,
      password: result.password,
      email: result.email,
      role: result.role,
    };
  }

  static async findByEmail(email: string) {
    const result = await userCollection.findOne({ email });
    if (!result) throw new Error("no user found with this email");
    return result._id.toString();
  }

  static async updatePassword(_id: string, hashedPassword: string) {
    if (!ObjectId.isValid(_id)) throw new Error("Invalid user id");
    const result = await userCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { password: hashedPassword } },
    );
    if (result.matchedCount !== 1) {
      throw new Error("user no longer exists");
    }
    return result;
  }
}
