"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import type { Certificate } from "@/types/certificate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Building2, ExternalLink, Download, Share2, Eye } from 'lucide-react'
import Link from "next/link"

export default function CertificatePage() {
  const params = useParams()
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewCount, setViewCount] = useState<number>(0)

  useEffect(() => {
    if (params.id) {
      fetchCertificate(params.id as string)
    }
  }, [params.id])

  const fetchCertificate = async (id: string) => {
    try {
      setError(null)
      console.log("Fetching certificate:", id)
      
      const response = await fetch(`/api/certificates/${id}`)
      console.log("Certificate fetch response:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Certificate data:", data)
        setCertificate(data)
        setViewCount(data.views || 0)

        // Track the view (don't await to avoid blocking UI)
        trackView(id)
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
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Certificates
              </Link>
            </Button>
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
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Certificates
            </Link>
          </Button>
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
                      src={`/api/certificates/${certificate._id}/file`}
                      className="w-full h-full border-0"
                      title={certificate.title}
                      style={{ minHeight: "600px" }}
                      onError={() => setError("Failed to load certificate file")}
                    />
                  </div>
                ) : (
                  // Image Display - Responsive with proper aspect ratio
                  <div className="relative w-full bg-muted rounded-t-lg overflow-hidden">
                    <img
                      src={`/api/certificates/${certificate._id}/file`}
                      alt={certificate.title}
                      className="w-full h-auto object-contain max-h-screen"
                      style={{ maxHeight: "80vh", width: "100%" }}
                      onError={() => setError("Failed to load certificate image")}
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <a href={`/api/certificates/${certificate._id}/file`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Full Size
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={`/api/certificates/${certificate._id}/file`} download={certificate.fileName}>
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
                {/* View Counter */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span>{formatViewCount(viewCount)} views</span>
                  {/* Debug info */}
                  <span className="text-xs opacity-50">({viewCount})</span>
                </div>
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

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Added on {certificate.createdAt ? formatDate(certificate.createdAt) : "Unknown date"}
                  </p>
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
