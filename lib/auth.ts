import "server-only"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import clientPromise from "./mongodb"
import { ObjectId } from "mongodb"
import { randomBytes, createHash } from "crypto"

export interface User {
  _id: string
  username: string
  role: string
  createdAt: Date
  lastLogin?: Date
}

export interface Session {
  sessionId: string
  userId: string
  expiresAt: Date
  createdAt: Date
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

export async function createSession(userId: string): Promise<string> {
  const client = await clientPromise
  const db = client.db("certificates")

  const sessionId = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await db.collection("sessions").insertOne({
    sessionId,
    userId: new ObjectId(userId),
    expiresAt,
    createdAt: new Date(),
  })

  const cookieStore = await cookies()
  cookieStore.set("session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  })

  return sessionId
}

export async function getSession(): Promise<{ user: User; session: Session } | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value

  if (!sessionId) {
    return null
  }

  const client = await clientPromise
  const db = client.db("certificates")

  const session = await db.collection("sessions").findOne({
    sessionId,
    expiresAt: { $gt: new Date() },
  })

  if (!session) {
    return null
  }

  const user = await db.collection("users").findOne({
    _id: session.userId,
  })

  if (!user) {
    return null
  }

  return {
    user: {
      _id: user._id.toString(),
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    },
    session: {
      sessionId: session.sessionId,
      userId: session.userId.toString(),
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    },
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value

  if (sessionId) {
    const client = await clientPromise
    const db = client.db("certificates")

    await db.collection("sessions").deleteOne({ sessionId })
  }

  cookieStore.delete("session")
}

export async function requireAuth(): Promise<User> {
  const sessionData = await getSession()

  if (!sessionData) {
    redirect("/admin/login")
  }

  return sessionData.user
}

export async function verifyCredentials(username: string, password: string): Promise<User | null> {
  try {
    const client = await clientPromise
    const db = client.db("certificates")

    console.log("🔍 Attempting to find user:", username)
    console.log("🔍 Database name:", db.databaseName)

    // Check if users collection exists
    const collections = await db.listCollections().toArray()
    console.log(
      "📋 Available collections:",
      collections.map((c) => c.name),
    )

    // Count users in collection
    const userCount = await db.collection("users").countDocuments()
    console.log("👥 Total users in collection:", userCount)

    // Find all users (for debugging)
    const allUsers = await db.collection("users").find({}).toArray()
    console.log(
      "👤 All users:",
      allUsers.map((u) => ({ username: u.username, role: u.role })),
    )

    const user = await db.collection("users").findOne({ username })

    if (!user) {
      console.log("❌ User not found in database")
      return null
    }

    console.log("✅ User found:", {
      id: user._id,
      username: user.username,
      role: user.role,
      hasPasswordHash: !!user.passwordHash,
    })

    const hashedPassword = hashPassword(password)
    console.log("🔐 Password verification:")
    console.log("   Input password:", password)
    console.log("   Hashed input:", hashedPassword)
    console.log("   Stored hash:", user.passwordHash)

    const isValid = hashedPassword === user.passwordHash
    console.log("   Match result:", isValid ? "✅ VALID" : "❌ INVALID")

    if (!isValid) {
      return null
    }

    // Update last login
    await db.collection("users").updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } })

    return {
      _id: user._id.toString(),
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: new Date(),
    }
  } catch (error) {
    console.error("💥 Error in verifyCredentials:", error)
    return null
  }
}
