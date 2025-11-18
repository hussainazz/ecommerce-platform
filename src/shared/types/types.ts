export type UserRole = "user" | "admin";

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
  inventory: number;
  description: string | null;
  review?: {
    user_id: string;
    rate: 1 | 2 | 3 | 4 | 5;
    text: string;
  }[];
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
  _id?: string;
  username: string;
  password: string;
  email: string;
  role: UserRole;
}
