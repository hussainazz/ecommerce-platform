import { ObjectId } from "mongodb";
import { userCollection } from "@db/schemas/user.schema.ts";
import { tokenCollection } from "@db/schemas/token.schema.ts";
import * as Types from "@shared/types/types.ts";
import bcrypt from "bcrypt";

export class UserService {
  static async register(
    data: Omit<Types.User, "_id" | "role" | "created_at">,
  ): Promise<Types.User> {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const result = await userCollection.insertOne({ ...data, role: "user" });
    return {
      _id: result.insertedId.toString(),
      username: data.username,
      password: passwordHash,
      email: data.email,
      role: "user", // for now;  must handle later
      created_at: new Date(),
    };
  }

  static async storeToken(
    jti: string,
    userId: string,
    tokenRaw: string,
    maxAge: number,
  ) {
    // should create validation everywhere that we used Data.now()
    if (!jti || !tokenRaw || !userId || !maxAge)
      throw new Error("user id, token or exp date is missing");
    const tokenHash = await bcrypt.hash(tokenRaw, 12);
    const created_at = new Date();
    const expires_at = new Date(maxAge + Date.now());
    await tokenCollection.insertOne({
      jti,
      userId,
      tokenHash,
      expires_at,
      created_at,
    });
    return { jti, userId, tokenHash, expires_at, created_at };
  }

  static async findToken(jti: string) {
    const token = await tokenCollection.findOne({ jti });
    const userExist = await this.findById(token?.userId);
    if (!token || token.expiresAt < Date.now() || !userExist) {
      if (token?.expiresAt < Date.now()) {
        this.deleteToken(token?.jti);
      }
      return null;
    }
    return {
      tokenHash: token.tokenHash,
      userId: token.userId,
    };
  }

  static async deleteToken(jti: string) {
    const result = await tokenCollection.deleteOne({ jti });
    if (result.deletedCount === 1) return true;
    return false;
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
      created_at: result.created_at,
    };
  }

  static async findIdByUsername(username: string) {
    const user = await userCollection.findOne({ username });
    if (!user) return false;
    return user._id.toString();
  }

  static async findByEmail(email: string) {
    const result = await userCollection.findOne({ email });
    if (!result) throw new Error("no user found with this email");
    return result._id.toString();
  }

  static async deleteUser(_id: string) {
    if (!ObjectId.isValid(_id)) throw new Error("Invalid user id");
    const result = await userCollection.deleteOne({ _id: new ObjectId(_id) });
    if (result.deletedCount !== 1) throw new Error("no user found to delete");
    return result;
  }

  static async updatePassword(_id: string, password: string) {
    if (!ObjectId.isValid(_id)) throw new Error("Invalid user id");
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await userCollection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { password: hashedPassword } },
    );
    if (result.matchedCount !== 1) {
      throw new Error("user no longer exists");
    }
    return result;
  }

  static async findByPassword(_id: string, password: string) {
    if (!ObjectId.isValid(_id)) throw new Error("Invalid user id");
    const user = await this.findById(_id);
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) return user;
    return false;
  }
}
