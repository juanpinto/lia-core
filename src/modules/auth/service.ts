import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { UnauthorizedError } from "../../lib/errors.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  type CompanyUserRecord,
} from "./repository.js";
import type { CreateUserBody, LoginBody } from "./schemas.js";

export interface JwtPayload {
  sub: string;
  companyId: string;
  email: string;
  role: "admin" | "member";
}

export interface AuthTokenResponse {
  token: string;
  user: Omit<CompanyUserRecord, "passwordHash">;
}

function signToken(payload: JwtPayload): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (jwt.sign as any)(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function safeUser(
  user: CompanyUserRecord,
): Omit<CompanyUserRecord, "passwordHash"> {
  const { passwordHash: _omit, ...rest } = user;
  return rest;
}

export async function loginService(body: LoginBody): Promise<AuthTokenResponse> {
  const user = await findUserByEmail(body.email);
  if (!user) throw new UnauthorizedError("Invalid email or password.");

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Invalid email or password.");

  const payload: JwtPayload = {
    sub: user.id,
    companyId: user.companyId,
    email: user.email,
    role: user.role,
  };

  return { token: signToken(payload), user: safeUser(user) };
}

export async function getMeService(
  userId: string,
): Promise<Omit<CompanyUserRecord, "passwordHash">> {
  const user = await findUserById(userId);
  if (!user) throw new UnauthorizedError();
  return safeUser(user);
}

export async function createUserService(
  body: CreateUserBody,
): Promise<Omit<CompanyUserRecord, "passwordHash">> {
  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await createUser({
    companyId: body.companyId,
    email: body.email,
    passwordHash,
    role: body.role,
  });
  return safeUser(user);
}
