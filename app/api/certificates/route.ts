import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("certificates")

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const publicOnly = searchParams.get("public") === "true"

    const query: any = {}

    if (publicOnly) {
      query.isPublic = true
    }

    if (category && category !== "all") {
      query.category = category
    }

    if (search) {
      query.$text = { $search: search }
    }

    const certificates = await db.collection("certificates").find(query).sort({ dateIssued: -1 }).toArray()

    return NextResponse.json(certificates)
  } catch (error) {
    console.error("Error fetching certificates:", error)
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const sessionData = await getSession()
    if (!sessionData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("certificates")

    const formData = await request.formData()
    const file = formData.get("file") as File
    const certificateData = JSON.parse(formData.get("data") as string)

    let fileData = null
    let fileName = ""
    let fileType = ""
    let fileSize = 0

    if (file) {
      const bytes = await file.arrayBuffer()
      fileData = Buffer.from(bytes).toString("base64")
      fileName = file.name
      fileType = file.type
      fileSize = file.size
    }

    const certificate = {
      ...certificateData,
      dateIssued: new Date(certificateData.dateIssued),
      expiryDate: certificateData.expiryDate ? new Date(certificateData.expiryDate) : null,
      skills: certificateData.skills.split(",").map((skill: string) => skill.trim()),
      fileData,
      fileName,
      fileType,
      fileSize,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("certificates").insertOne(certificate)

    return NextResponse.json({
      success: true,
      id: result.insertedId,
    })
  } catch (error) {
    console.error("Error creating certificate:", error)
    return NextResponse.json({ error: "Failed to create certificate" }, { status: 500 })
  }
}
