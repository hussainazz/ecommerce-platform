import { ObjectId } from "mongodb";
import { userCollection } from "@db/schemas/user.schema.ts";
import * as Types from "@shared/types/types.ts";
import bcrypt from "bcrypt";
import { token } from "morgan";

export const hashPassword = async (password: string) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hash: string) => {
  return await bcrypt.compare(hash, password);
};

export class UserService {
  static async register(
    data: Omit<Types.User, "_id" | "role" | "refreshToken">,
    tokenRaw: string,
    maxAge: number,
  ): Promise<Types.User> {
    const passwordHash = await hashPassword(data.password);
    const result = await userCollection.insertOne(data);
    const refresh_token = await this.storeToken(
      result.insertedId,
      tokenRaw,
      maxAge,
    );
    return {
      _id: result.insertedId,
      username: data.username,
      password: passwordHash,
      email: data.email,
      role: "user", // for now;  must handle later
      refresh_token,
    };
  }

  static async storeToken(
    userId: string | ObjectId,
    tokenRaw: string,
    maxAge: number,
  ) {
    // should create validation everywhere that we used Data.now()
    if (!tokenRaw || !userId || !maxAge)
      throw new Error("user id, token or exp date is missing");
    const tokenHash = await bcrypt.hash(tokenRaw, 12);
    if (typeof userId === "string") {
      if (!ObjectId.isValid(userId)) throw new Error("user id is invalid");
      userId = new ObjectId(userId);
    }
    const expiresAt = maxAge + Date.now();
    const createdAt = Date.now();
    await userCollection.updateOne(
      { _id: userId },
      {
        $push: {
          refreshTokens: { tokenHash, expiresAt, createdAt } as any,
        },
      },
    );
    return { tokenHash, expiresAt, createdAt };
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

  static async updatePassword(_id: string, password: string) {
    if (!ObjectId.isValid(_id)) throw new Error("Invalid user id");
    const hashedPassword = await hashPassword(password);
    const result = await userCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { password: hashedPassword } },
    );
    if (result.matchedCount !== 1) {
      throw new Error("user no longer exists");
    }
    return result;
  }

  static async isPassMatch(_id: string, password: string) {
    if (!ObjectId.isValid(_id)) throw new Error("Invalid user id");
    const user = await this.findById(_id);
    const isMatch = await verifyPassword(user.password, password);

    if (!isMatch) return false;
    return true;
  }
}
