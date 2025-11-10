import type { ObjectId } from "mongodb";

export interface User {
  email: string;
  username: string;
  password: string;
}
export interface Product {
  title: string;
  price: number;
  inventory: number;
  category: string;
  description: string;
}
export interface Order {
  user_id: ObjectId;
  items: {
    product_id: ObjectId;
    count: number;
  }[];
  amount: number;
  status: "completed" | "pending" | "canceled";
  created_at: Date;
  completed_at?: Date;
  cancelled_at?: Date;
}
export interface Payment {
  user_id: ObjectId;
  order_id: ObjectId;
  status: "ok" | "failed";
  amount: number;
  created_at: Date;
  cancelled_at?: Date;
}
