import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

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

    const certificate = await db.collection("certificates").findOne({
      _id: new ObjectId(id),
    })

    if (!certificate || !certificate.fileData) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Convert base64 back to buffer
    const fileBuffer = Buffer.from(certificate.fileData, "base64")

    // Create a unique ETag based on file content and update time
    const fileUpdatedAt = certificate.fileUpdatedAt || certificate.updatedAt || certificate.createdAt
    const contentHash = require("crypto").createHash("md5").update(fileBuffer).digest("hex")
    const etag = `"${contentHash}-${new Date(fileUpdatedAt).getTime()}"`

    console.log(`📁 Serving file for certificate ${id}:`, {
      fileName: certificate.fileName,
      fileType: certificate.fileType,
      fileSize: fileBuffer.length,
      etag,
      lastModified: fileUpdatedAt,
    })

    const headers: Record<string, string> = {
      "Content-Type": certificate.fileType || "application/octet-stream",
      "Content-Length": fileBuffer.length.toString(),
      ETag: etag,
      "Last-Modified": new Date(fileUpdatedAt).toUTCString(),
      // More aggressive cache control for updated files
      "Cache-Control": "public, max-age=300, must-revalidate", // 5 minutes cache with revalidation
      Vary: "Accept-Encoding",
    }

    // Check if client has the latest version
    const clientETag = request.headers.get("if-none-match")
    const clientLastModified = request.headers.get("if-modified-since")

    if (clientETag === etag || (clientLastModified && new Date(clientLastModified) >= new Date(fileUpdatedAt))) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } })
    }

    // For images, add quality preservation headers
    if (certificate.fileType?.startsWith("image/")) {
      headers["Content-Disposition"] = `inline; filename="${certificate.fileName}"`
      // Prevent compression for images
      headers["Content-Encoding"] = "identity"
    } else {
      headers["Content-Disposition"] = `inline; filename="${certificate.fileName}"`
    }

    return new NextResponse(fileBuffer, { headers })
  } catch (error) {
    console.error("Error serving file:", error)
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 })
  }
}
