import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await the params in Next.js 15
    const { id } = await params

    // Validate the ID format
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid certificate ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("certificates")

    const certificate = await db.collection("certificates").findOne({ _id: new ObjectId(id) })

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    return NextResponse.json(certificate)
  } catch (error) {
    console.error("Error fetching certificate:", error)
    return NextResponse.json({ error: "Failed to fetch certificate" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const sessionData = await getSession()
    if (!sessionData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await the params in Next.js 15
    const { id } = await params

    // Validate the ID format
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid certificate ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("certificates")

    const result = await db.collection("certificates").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting certificate:", error)
    return NextResponse.json({ error: "Failed to delete certificate" }, { status: 500 })
  }
}
