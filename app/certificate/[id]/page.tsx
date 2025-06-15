"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import type { Certificate } from "@/types/certificate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Building2, ExternalLink, Download, Share2, Eye, RefreshCw, Settings } from "lucide-react"
import Link from "next/link"

export default function CertificatePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewCount, setViewCount] = useState<number>(0)
  const [refreshing, setRefreshing] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Check if user came from admin or if they're an admin
  const fromAdmin = searchParams.get("from") === "admin"
  const returnUrl = fromAdmin ? "/admin" : "/"

  useEffect(() => {
    if (params.id) {
      fetchCertificate(params.id as string)
      checkAdminStatus()
    }
  }, [params.id])

  const checkAdminStatus = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setIsAdmin(userData.user?.role === "admin")
      }
    } catch (error) {
      console.log("Not authenticated as admin")
    }
  }

  const fetchCertificate = async (id: string, skipViewTracking = false) => {
    try {
      setError(null)
      console.log("Fetching certificate:", id)

      const response = await fetch(`/api/certificates/${id}?t=${Date.now()}`, {
        cache: "no-store", // Ensure we get fresh data
      })
      console.log("Certificate fetch response:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Certificate data:", data)
        setCertificate(data)
        setViewCount(data.views || 0)

        // Track the view only on initial load and only if not admin or not from admin
        if (!skipViewTracking && !fromAdmin) {
          trackView(id)
        }
      } else if (response.status === 404) {
        setError("Certificate not found")
      } else {
        setError("Failed to load certificate")
      }
    } catch (error) {
      console.error("Error fetching certificate:", error)
      setError("Network error occurred")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const trackView = async (id: string) => {
    try {
      console.log("Tracking view for certificate:", id)

      const response = await fetch(`/api/certificates/${id}/view`, {
        method: "POST",
      })

      console.log("View tracking response:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("View tracking data:", data)
        setViewCount(data.views)
      } else {
        const errorData = await response.json()
        console.error("View tracking failed:", errorData)
      }
    } catch (error) {
      console.error("Error tracking view:", error)
      // Don't show error to user for view tracking failures
    }
  }

  const handleRefresh = async () => {
    if (!params.id) return
    setRefreshing(true)
    await fetchCertificate(params.id as string, true) // Skip view tracking on refresh
  }

  const handleBack = () => {
    // Use router.back() if there's history, otherwise go to appropriate default
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(returnUrl)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatViewCount = (count: number | undefined | null): string => {
    const num = count || 0
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: certificate?.title,
          text: `Check out this certificate: ${certificate?.title} by ${certificate?.issuer}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  // Generate cache-busting URL for files
  const getFileUrl = (baseUrl: string) => {
    if (!certificate) return baseUrl
    const timestamp = certificate.fileUpdatedAt
      ? new Date(certificate.fileUpdatedAt).getTime()
      : certificate.updatedAt
        ? new Date(certificate.updatedAt).getTime()
        : Date.now()
    return `${baseUrl}?v=${timestamp}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading certificate...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || "Certificate Not Found"}</h1>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {fromAdmin || isAdmin ? "Back to Admin" : "Back to Certificates"}
              </Button>
              {params.id && (
                <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Retry
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isExpired = certificate.expiryDate && new Date(certificate.expiryDate) < new Date()
  const skills = certificate.skills || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {fromAdmin || isAdmin ? "Back to Admin Dashboard" : "Back to Certificates"}
            </Button>
            <div className="flex gap-2">
              {(fromAdmin || isAdmin) && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin">
                    <Settings className="w-4 h-4 mr-2" />
                    Admin Dashboard
                  </Link>
                </Button>
              )}
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing} size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Certificate Image */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardContent className="p-0">
                {certificate.fileType?.includes("pdf") ? (
                  // PDF Display - Full height with no scroll
                  <div className="relative w-full bg-muted rounded-t-lg overflow-hidden" style={{ height: "80vh" }}>
                    <iframe
                      src={getFileUrl(`/api/certificates/${certificate._id}/file`)}
                      className="w-full h-full border-0"
                      title={certificate.title}
                      style={{ minHeight: "600px" }}
                      key={`pdf-fullpage-${certificate._id}-${certificate.fileUpdatedAt || certificate.updatedAt || Date.now()}`}
                      onLoad={() => console.log(`📄 PDF loaded in full page for ${certificate.title}`)}
                      onError={() => {
                        console.error(`❌ PDF failed to load in full page for ${certificate.title}`)
                        setError("Failed to load certificate file")
                      }}
                    />
                  </div>
                ) : (
                  // Image Display - Responsive with proper aspect ratio
                  <div className="relative w-full bg-muted rounded-t-lg overflow-hidden">
                    <img
                      src={getFileUrl(`/api/certificates/${certificate._id || "/placeholder.svg"}/file`)}
                      alt={certificate.title}
                      className="w-full h-auto object-contain max-h-screen"
                      style={{ maxHeight: "80vh", width: "100%" }}
                      key={`img-fullpage-${certificate._id}-${certificate.fileUpdatedAt || certificate.updatedAt || Date.now()}`}
                      onLoad={() => console.log(`🖼️ Image loaded in full page for ${certificate.title}`)}
                      onError={(e) => {
                        console.error(`❌ Image failed to load in full page for ${certificate.title}`)
                        // Fallback to current timestamp
                        const img = e.target as HTMLImageElement
                        if (!img.src.includes("&fallback=")) {
                          img.src = `/api/certificates/${certificate._id}/file?v=${Date.now()}&fallback=true`
                        } else {
                          setError("Failed to load certificate image")
                        }
                      }}
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <a
                        href={getFileUrl(`/api/certificates/${certificate._id}/file`)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Full Size
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={getFileUrl(`/api/certificates/${certificate._id}/file`)} download={certificate.fileName}>
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button variant="outline" onClick={handleShare}>
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Certificate Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{certificate.title}</CardTitle>
                {/* View Counter - only show if not from admin */}
                {!fromAdmin && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span>{formatViewCount(viewCount)} views</span>
                  </div>
                )}
                {/* Admin indicator */}
                {(fromAdmin || isAdmin) && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Settings className="w-3 h-3 mr-1" />
                      Admin View
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {formatViewCount(viewCount)} public views
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium">{certificate.issuer}</span>
                </div>

                {certificate.description && <p className="text-sm text-muted-foreground">{certificate.description}</p>}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Issued: {formatDate(certificate.dateIssued)}</span>
                  </div>

                  {certificate.expiryDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span className={isExpired ? "text-destructive" : ""}>
                        Expires: {formatDate(certificate.expiryDate)}
                        {isExpired && " (Expired)"}
                      </span>
                    </div>
                  )}
                </div>

                {certificate.category && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Category</p>
                    <Badge variant="secondary">{certificate.category}</Badge>
                  </div>
                )}

                {skills.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Skills & Technologies</p>
                    <div className="flex flex-wrap gap-1">
                      {skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Information */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">File Information</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {certificate.fileName && <p>Name: {certificate.fileName}</p>}
                    {certificate.fileType && <p>Type: {certificate.fileType}</p>}
                    {certificate.fileSize && <p>Size: {(certificate.fileSize / (1024 * 1024)).toFixed(2)} MB</p>}
                  </div>
                </div>

                {/* Visibility Status */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Status</p>
                  <div className="flex gap-2">
                    <Badge variant={certificate.isPublic ? "default" : "secondary"}>
                      {certificate.isPublic ? "Public" : "Private"}
                    </Badge>
                    {isExpired && <Badge variant="destructive">Expired</Badge>}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Added on {certificate.createdAt ? formatDate(certificate.createdAt) : "Unknown date"}
                  </p>
                  {certificate.updatedAt && certificate.updatedAt !== certificate.createdAt && (
                    <p className="text-xs text-muted-foreground">Updated on {formatDate(certificate.updatedAt)}</p>
                  )}
                  {certificate.fileUpdatedAt && certificate.fileUpdatedAt !== certificate.updatedAt && (
                    <p className="text-xs text-muted-foreground">
                      File updated on {formatDate(certificate.fileUpdatedAt)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Verification Note */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <h3 className="font-medium text-green-900 mb-2">Verification</h3>
                <p className="text-sm text-green-700">
                  This certificate is hosted for verification purposes. You can verify its authenticity by contacting{" "}
                  {certificate.issuer} directly or checking their official verification system.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
