import type { ObjectId } from "mongodb";
import z from "zod";
export type UserRole = "user" | "admin";
export type Rate = 1 | 2 | 3 | 4 | 5;

export interface Payment {
  _id?: string;
  user_id: string;
  order_id: string;
  status: "success" | "fail" | "pending";
  amount: bigint;
  authority: string | null;
  created_at?: Date;
  canceled_at?: Date;
}

export interface Product {
  _id?: string;
  title: string;
  price: bigint;
  category: string;
  stock: number;
  description: string | null;
}

export interface Review {
  _id: string;
  product_id: string;
  user_id: string;
  rate: 1 | 2 | 3 | 4 | 5;
  comment: string;
  created_at: Date;
}

export interface Order {
  _id?: string;
  status: "completed" | "confirmed" | "pending" | "canceled";
  shipping_address: {
    street: string;
    city: string;
    province: string;
    postCode: bigint;
  };
  totalPrice: bigint;
  products: {
    product_id: string;
    count: number;
  }[];
  user_id: string;
  created_at?: Date;
  canceled_at?: Date;
  completed_at?: Date;
  confirmed_at?: Date;
}

export interface User {
  _id?: string | ObjectId;
  username: string;
  password: string;
  email: string;
  role?: UserRole;
  created_at: Date;
}

export interface RefToken {
  jti: string;
  userId: string;
  tokenHash: string;
  expires_at: Date;
  created_at: Date;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const RegisterSchema = z.object({
  username: z
    .string()
    .min(5, "username must be at least 5 character")
    .max(30, "username must be less than 30 character")
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "password too short")
    .max(30, "Passwordord must be less than 30")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase and number",
    )
    .transform((val) => val.trim()),
  email: z.email("email format is not valid"),
});
export const LoginSchema = z.object({
  username: z
    .string()
    .min(5, "username must be at least 5 character")
    .max(30, "username must be less than 30 character")
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "password must be more that 8 character")
    .max(30, "password must be less than 30 character")
    .transform((val) => val.trim()),
});
export const OrderSchema = z.object({
  shipping_address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    province: z.string().min(1),
    postCode: z
      .string()
      .regex(/^\d{10}$/, "Post code must be exactly 10 digits")
      .transform((val) => BigInt(val)),
  }),
  amount: z.coerce.bigint().positive(),
  products: z.array(
    z.object({
      product_id: z.string().min(1),
      count: z.number().int().min(1, "Count must be at least 1"),
    }),
  ),
});
export const orderItemsScehema = z.array(
  z.object({
    product_id: z.string(),
    count: z.number().min(1),
  }),
);

export const PaymentSchema = z.object({
  order_id: z.string(),
  amount: z.coerce.bigint(),
});
