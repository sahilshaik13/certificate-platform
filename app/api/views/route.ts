import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("certificates")

    console.log("Fetching analytics data...")

    // Get total views from all certificates
    const totalViewsResult = await db
      .collection("certificates")
      .aggregate([
        { $match: { views: { $exists: true, $ne: null, $gt: 0 } } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } },
      ])
      .toArray()

    console.log("Total views result:", totalViewsResult)

    // Get unique visitors count
    const uniqueVisitorsCount = await db.collection("visitors").countDocuments()
    console.log("Unique visitors count:", uniqueVisitorsCount)

    // Get most viewed certificates
    const mostViewed = await db
      .collection("certificates")
      .find({
        isPublic: true,
        views: { $exists: true, $gt: 0 },
      })
      .sort({ views: -1 })
      .limit(5)
      .project({ title: 1, views: 1, issuer: 1 })
      .toArray()

    console.log("Most viewed certificates:", mostViewed)

    // Get recent views (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentViews = await db.collection("certificates").countDocuments({
      lastViewed: { $gte: yesterday },
    })

    console.log("Recent views:", recentViews)

    const totalViews = totalViewsResult[0]?.totalViews || 0
    const uniqueVisitors = uniqueVisitorsCount || 0

    const response = {
      totalViews,
      uniqueVisitors,
      recentViews: recentViews || 0,
      mostViewed: mostViewed || [],
    }

    console.log("Analytics response:", response)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      {
        totalViews: 0,
        uniqueVisitors: 0,
        recentViews: 0,
        mostViewed: [],
        error: "Failed to fetch analytics",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Tracking site visit...")

    // Get client IP address
    const forwarded = request.headers.get("x-forwarded-for")
    const realIP = request.headers.get("x-real-ip")
    const ip = forwarded?.split(",")[0] || realIP || request.ip || "unknown"

    console.log("Visitor IP:", ip)

    // Get user agent for better tracking
    const userAgent = request.headers.get("user-agent") || "unknown"

    const client = await clientPromise
    const db = client.db("certificates")

    // Check if this IP has visited before (within last 24 hours for unique daily visitors)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingVisitor = await db.collection("visitors").findOne({
      ip,
      visitDate: { $gte: today },
    })

    console.log("Existing visitor found:", !!existingVisitor)

    const isNewVisitor = !existingVisitor

    if (isNewVisitor) {
      // Record new visitor
      const insertResult = await db.collection("visitors").insertOne({
        ip,
        userAgent,
        visitDate: new Date(),
        firstVisit: new Date(),
        visitCount: 1,
      })
      console.log("New visitor recorded:", insertResult.insertedId)
    } else {
      // Update existing visitor's last visit
      const updateResult = await db.collection("visitors").updateOne(
        { ip, visitDate: { $gte: today } },
        {
          $set: { lastVisit: new Date() },
          $inc: { visitCount: 1 },
        },
      )
      console.log("Existing visitor updated:", updateResult.modifiedCount)
    }

    // Get updated analytics
    const totalViewsResult = await db
      .collection("certificates")
      .aggregate([
        { $match: { views: { $exists: true, $ne: null, $gt: 0 } } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } },
      ])
      .toArray()

    const uniqueVisitorsCount = await db.collection("visitors").countDocuments()

    const totalViews = totalViewsResult[0]?.totalViews || 0
    const uniqueVisitors = uniqueVisitorsCount || 0

    console.log("Updated analytics - Total views:", totalViews, "Unique visitors:", uniqueVisitors)

    return NextResponse.json({
      success: true,
      totalViews,
      uniqueVisitors,
      isNewVisitor,
    })
  } catch (error) {
    console.error("Error tracking view:", error)
    return NextResponse.json(
      {
        success: false,
        totalViews: 0,
        uniqueVisitors: 0,
        isNewVisitor: false,
        error: "Failed to track view",
      },
      { status: 500 },
    )
  }
}
