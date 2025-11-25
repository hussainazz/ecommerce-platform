import {
  registerHandler,
  createAccessToken,
  createRefreshToken,
} from "@features/auth/auth.controller.ts";
import { UserService } from "@features/auth/auth.service.ts";
import type { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";

vi.mock("@features/auth/auth.service.ts");

describe("Register Controller", () => {
  it("should register a user and set cookies", async () => {
    const next = vi.fn();
    const req = {
      body: {
        username: "testuser",
        password: "StrongPasswrd@!1",
        email: "test@test.com",
      },
    } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
    } as unknown as Response;
    vi.mocked(UserService.register).mockResolvedValue({
      _id: "123",
      username: "testuser",
      password: "StrongPassword1",
      email: "test@gmail.com",
      role: "user",
    });
    await registerHandler(req, res, next);

    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        user: { id: "123", username: "testuser" },
      }),
    );
  });
});
