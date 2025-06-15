import { type NextRequest, NextResponse } from "next/server"
import { verifyCredentials, createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("Login attempt received")

    const body = await request.json()
    const { username, password } = body

    console.log("Login data:", { username, password: password ? "***" : "missing" })

    if (!username || !password) {
      console.log("Missing credentials")
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    console.log("Verifying credentials...")
    const user = await verifyCredentials(username, password)

    if (!user) {
      console.log("Invalid credentials")
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("Creating session for user:", user._id)
    await createSession(user._id)

    console.log("Login successful")
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
