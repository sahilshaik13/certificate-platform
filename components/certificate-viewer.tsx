"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, ExternalLink, Calendar, Building2 } from "lucide-react"
import type { Certificate } from "@/types/certificate"

interface CertificateViewerProps {
  certificate: Certificate
  trigger?: React.ReactNode
  isAdmin?: boolean
}

export function CertificateViewer({ certificate, trigger, isAdmin = false }: CertificateViewerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const isExpired = certificate.expiryDate && new Date(certificate.expiryDate) < new Date()
  const skills = certificate.skills || []

  // Generate cache-busting URL for files
  const getFileUrl = (baseUrl: string) => {
    const timestamp = certificate.fileUpdatedAt
      ? new Date(certificate.fileUpdatedAt).getTime()
      : certificate.updatedAt
        ? new Date(certificate.updatedAt).getTime()
        : Date.now()
    return `${baseUrl}?v=${timestamp}`
  }

  // Generate URL with admin context
  const getFullPageUrl = () => {
    const baseUrl = `/certificate/${certificate._id}`
    return isAdmin ? `${baseUrl}?from=admin` : baseUrl
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Eye className="w-4 h-4 mr-2" />
      Preview
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">{certificate.title}</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="w-4 h-4" />
            {certificate.issuer}
            {isAdmin && (
              <Badge variant="outline" className="text-xs ml-2">
                Admin Preview
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[75vh] overflow-hidden">
          {/* Certificate Display */}
          <div className="lg:col-span-2">
            <div className="bg-muted rounded-lg overflow-hidden h-full">
              {certificate.fileType?.includes("pdf") ? (
                <iframe
                  src={getFileUrl(`/api/certificates/${certificate._id}/file`)}
                  className="w-full h-full border-0 rounded"
                  style={{ minHeight: "500px", height: "65vh" }}
                  title={certificate.title}
                  key={`pdf-${certificate._id}-${certificate.fileUpdatedAt || certificate.updatedAt || Date.now()}`}
                  onLoad={() => console.log(`📄 PDF loaded for ${certificate.title}`)}
                  onError={() => console.error(`❌ PDF failed to load for ${certificate.title}`)}
                />
              ) : (
                <div
                  className="flex justify-center items-center h-full bg-muted rounded p-4"
                  style={{ minHeight: "500px", height: "65vh" }}
                >
                  <img
                    src={getFileUrl(`/api/certificates/${certificate._id || "/placeholder.svg"}/file`)}
                    alt={certificate.title}
                    className="max-w-full max-h-full object-contain rounded"
                    key={`img-${certificate._id}-${certificate.fileUpdatedAt || certificate.updatedAt || Date.now()}`}
                    onLoad={() => console.log(`🖼️ Image loaded in viewer for ${certificate.title}`)}
                    onError={(e) => {
                      console.error(`❌ Image failed to load in viewer for ${certificate.title}`)
                      // Fallback to current timestamp
                      const img = e.target as HTMLImageElement
                      if (!img.src.includes("&fallback=")) {
                        img.src = `/api/certificates/${certificate._id}/file?v=${Date.now()}&fallback=true`
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Certificate Details */}
          <div className="space-y-4 overflow-y-auto max-h-[65vh]">
            {/* Basic Info */}
            <div className="space-y-3">
              {certificate.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{certificate.description}</p>
                </div>
              )}

              {/* Dates */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Dates</h4>
                <div className="space-y-1">
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
              </div>

              {/* Category */}
              {certificate.category && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Category</h4>
                  <Badge variant="secondary">{certificate.category}</Badge>
                </div>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Skills & Technologies</h4>
                  <div className="flex flex-wrap gap-1">
                    {skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* File Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">File Information</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {certificate.fileName && <p>Name: {certificate.fileName}</p>}
                  {certificate.fileType && <p>Type: {certificate.fileType}</p>}
                  {certificate.fileSize && <p>Size: {(certificate.fileSize / (1024 * 1024)).toFixed(2)} MB</p>}
                </div>
              </div>

              {/* Views - show for admin */}
              {isAdmin && certificate.views !== undefined && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Analytics</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Views: {certificate.views.toLocaleString()}</p>
                    {certificate.lastViewed && <p>Last viewed: {formatDate(certificate.lastViewed)}</p>}
                  </div>
                </div>
              )}

              {/* Visibility */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Status</h4>
                <div className="flex gap-2">
                  <Badge variant={certificate.isPublic ? "default" : "secondary"}>
                    {certificate.isPublic ? "Public" : "Private"}
                  </Badge>
                  {isExpired && <Badge variant="destructive">Expired</Badge>}
                </div>
              </div>

              {/* Metadata */}
              <div className="pt-2 border-t">
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
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button asChild className="flex-1">
            <a href={getFullPageUrl()} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Full Page
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={getFileUrl(`/api/certificates/${certificate._id}/file`)} target="_blank" rel="noopener noreferrer">
              <Eye className="w-4 h-4 mr-2" />
              Open File
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={getFileUrl(`/api/certificates/${certificate._id}/file`)} download={certificate.fileName}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
