import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("certificates")

    const users = await db.collection("users").find({}).toArray()

    return NextResponse.json({
      count: users.length,
      users: users.map((user) => ({
        id: user._id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        hasPasswordHash: !!user.passwordHash,
      })),
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
