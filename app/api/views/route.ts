import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for views (in production, use a database)
const viewData = {
  totalViews: 0,
  uniqueIPs: new Set<string>(),
}

export async function GET() {
  return NextResponse.json({
    totalViews: viewData.totalViews,
    uniqueViews: viewData.uniqueIPs.size,
  })
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP address
    const forwarded = request.headers.get("x-forwarded-for")
    const realIP = request.headers.get("x-real-ip")
    const ip = forwarded?.split(",")[0] || realIP || request.ip || "unknown"

    // Check if this IP has already been counted
    const isNewVisitor = !viewData.uniqueIPs.has(ip)

    if (isNewVisitor) {
      viewData.uniqueIPs.add(ip)
    }

    // Always increment total views
    viewData.totalViews++

    return NextResponse.json({
      success: true,
      totalViews: viewData.totalViews,
      uniqueViews: viewData.uniqueIPs.size,
      isNewVisitor,
    })
  } catch (error) {
    console.error("Error tracking view:", error)
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 })
  }
}
