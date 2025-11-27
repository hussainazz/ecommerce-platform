import { productCollection } from "@db/schemas/product.schema.ts";
import type { ObjectId } from "mongodb";
import z from "zod";
export type UserRole = "user" | "admin";
export type Rate = 1 | 2 | 3 | 4 | 5;

export interface Payment {
  _id?: string;
  user_id: string;
  order_id: string;
  status: "success" | "fail" | "pending";
  amount: number;
  created_at?: number;
  canceled_at?: number;
}

export interface Product {
  _id?: string;
  title: string;
  price: number;
  category: string;
  stock: number;
  description: string | null;
}

export interface Review {
  _id?: string;
  product_id: string;
  user_id: string;
  rate: 1 | 2 | 3 | 4 | 5;
  comment: string;
}

export interface Order {
  _id?: string;
  status: "completed" | "confirmed" | "pending" | "canceled";
  shipping_address: {
    street: string;
    city: string;
    province: string;
    postCode: number;
  };
  totalPrice: number;
  products: {
    product_id: string;
    count: number;
  }[];
  user_id: string;
  created_at?: number;
  canceled_at?: number;
  completed_at?: number;
  confirmed_at?: number;
}

export interface User {
  _id?: string | ObjectId;
  username: string;
  password: string;
  email: string;
  role?: UserRole;
  refresh_token?: {
    tokenHash: string;
    expiresAt: number;
    createdAt: number;
  };
  refresh_tokens?: {
    tokenHash: string;
    expiresAt: number;
    createdAt: number;
  }[];
}

export interface RefToken {
  jti: string;
  userId: string;
  tokenHash: string;
  expiresAt: number;
  createdAt: number;
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
    street: z.string(),
    city: z.string(),
    province: z.string(),
    postCode: z
      .number()
      .gte(1000000000, "post code must be a 10-digit number.")
      .lt(10000000000, "post code must be a 10-digit number."),
  }),
  products: z.array(
    z.object({
      product_id: z.string(),
      count: z.number().min(1, "count must be more than 0"),
    }),
  ),
});
export const orderItemsScehema = z.array(
  z.object({
    product: z.string(),
    count: z.number().min(1),
  }),
);
