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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Check if certificate exists
    const existingCertificate = await db.collection("certificates").findOne({ _id: new ObjectId(id) })
    if (!existingCertificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const certificateData = JSON.parse(formData.get("data") as string)

    let fileData = existingCertificate.fileData
    let fileName = existingCertificate.fileName
    let fileType = existingCertificate.fileType
    let fileSize = existingCertificate.fileSize
    let fileUpdated = false

    // If a new file is provided, process it
    if (file && file.size > 0) {
      // Check file size (50MB limit for high quality)
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: "File size too large. Maximum 50MB allowed." }, { status: 400 })
      }

      const bytes = await file.arrayBuffer()
      fileData = Buffer.from(bytes).toString("base64")
      fileName = file.name
      fileType = file.type
      fileSize = file.size
      fileUpdated = true

      console.log(`🔄 File updated for certificate ${id}:`)
      console.log(`   - New file: ${fileName} (${fileSize} bytes, ${fileType})`)
      console.log(`   - Base64 length: ${fileData.length}`)
    }

    const updateData = {
      ...certificateData,
      dateIssued: new Date(certificateData.dateIssued),
      expiryDate: certificateData.expiryDate ? new Date(certificateData.expiryDate) : null,
      skills: certificateData.skills
        .split(",")
        .map((skill: string) => skill.trim())
        .filter((skill: string) => skill.length > 0),
      fileData,
      fileName,
      fileType,
      fileSize,
      updatedAt: new Date(), // Always update this timestamp
      fileUpdatedAt: fileUpdated ? new Date() : existingCertificate.fileUpdatedAt, // Track file-specific updates
    }

    console.log(`📝 Updating certificate ${id} with data:`, {
      title: updateData.title,
      fileName: updateData.fileName,
      fileSize: updateData.fileSize,
      fileUpdated,
      updatedAt: updateData.updatedAt,
    })

    const result = await db.collection("certificates").updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    console.log(`✅ Update result:`, {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    // Return the updated certificate data
    const updatedCertificate = await db.collection("certificates").findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      message: "Certificate updated successfully",
      certificate: updatedCertificate,
      fileUpdated,
    })
  } catch (error) {
    console.error("Error updating certificate:", error)
    return NextResponse.json({ error: "Failed to update certificate" }, { status: 500 })
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
