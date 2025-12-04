import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import dbConnect from "./mongodb"
import User, { type IUser } from "./models/user"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export interface SessionUser {
  id: string
  username: string
  email: string
  avatar?: string
}

export async function createSession(user: IUser): Promise<string> {
  const token = await new SignJWT({
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    avatar: user.avatar,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET)

  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  return token
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

export async function updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  await dbConnect()
  await User.findByIdAndUpdate(userId, {
    isOnline,
    lastSeen: new Date(),
  })
}
