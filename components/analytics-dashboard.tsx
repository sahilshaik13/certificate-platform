"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Users, TrendingUp, Award } from "lucide-react"

interface AnalyticsData {
  totalViews: number
  uniqueVisitors: number
  recentViews: number
  mostViewed: Array<{
    _id: string
    title: string
    views: number
    issuer: string
  }>
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/views")
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num)) {
      return "0"
    }
    return num.toLocaleString()
  }

  const calculateAverage = (total: number, count: number): number => {
    if (!total || !count || count === 0) return 0
    return Math.round(total / count)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Failed to load analytics data</p>
        </CardContent>
      </Card>
    )
  }

  const totalViews = analytics.totalViews || 0
  const uniqueVisitors = analytics.uniqueVisitors || 0
  const recentViews = analytics.recentViews || 0
  const mostViewed = analytics.mostViewed || []

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalViews)}</div>
            <p className="text-xs text-muted-foreground">All time certificate views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(uniqueVisitors)}</div>
            <p className="text-xs text-muted-foreground">Unique IP addresses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(recentViews)}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Views</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(calculateAverage(totalViews, mostViewed.length))}</div>
            <p className="text-xs text-muted-foreground">Per certificate</p>
          </CardContent>
        </Card>
      </div>

      {/* Most Viewed Certificates */}
      <Card>
        <CardHeader>
          <CardTitle>Most Viewed Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          {mostViewed.length > 0 ? (
            <div className="space-y-4">
              {mostViewed.map((cert, index) => (
                <div key={cert._id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{cert.title || "Untitled Certificate"}</p>
                      <p className="text-sm text-muted-foreground">{cert.issuer || "Unknown Issuer"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{formatNumber(cert.views)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No certificate views yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
