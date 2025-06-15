import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await the params in Next.js 15
    const { id } = await params

    console.log("Tracking view for certificate ID:", id)

    // Validate the ID format
    if (!id || !ObjectId.isValid(id)) {
      console.log("Invalid certificate ID:", id)
      return NextResponse.json({ error: "Invalid certificate ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("certificates")

    // First, check if the certificate exists
    const existingCert = await db.collection("certificates").findOne({ _id: new ObjectId(id) })
    
    if (!existingCert) {
      console.log("Certificate not found:", id)
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    console.log("Certificate found, current views:", existingCert.views || 0)

    // Increment the view count and set lastViewed
    const result = await db.collection("certificates").updateOne(
      { _id: new ObjectId(id) },
      {
        $inc: { views: 1 },
        $set: { lastViewed: new Date() },
      },
    )

    console.log("Update result:", result)

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    // Get the updated certificate to return the new view count
    const updatedCert = await db.collection("certificates").findOne(
      { _id: new ObjectId(id) },
      { projection: { views: 1, lastViewed: 1 } }
    )

    console.log("Updated certificate views:", updatedCert?.views)

    return NextResponse.json({
      success: true,
      views: updatedCert?.views || 1,
      lastViewed: updatedCert?.lastViewed,
    })
  } catch (error) {
    console.error("Error tracking view:", error)
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 })
  }
}
