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
}

export function CertificateViewer({ certificate, trigger }: CertificateViewerProps) {
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
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[75vh] overflow-hidden">
          {/* Certificate Display */}
          <div className="lg:col-span-2">
            <div className="bg-muted rounded-lg overflow-hidden h-full">
              {certificate.fileType?.includes("pdf") ? (
                <iframe
                  src={`/api/certificates/${certificate._id}/file`}
                  className="w-full h-full border-0 rounded"
                  style={{ minHeight: "500px", height: "65vh" }}
                  title={certificate.title}
                />
              ) : (
                <div
                  className="flex justify-center items-center h-full bg-muted rounded p-4"
                  style={{ minHeight: "500px", height: "65vh" }}
                >
                  <img
                    src={`/api/certificates/${certificate._id}/file`}
                    alt={certificate.title}
                    className="max-w-full max-h-full object-contain rounded"
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

              {/* Visibility */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Visibility</h4>
                <Badge variant={certificate.isPublic ? "default" : "secondary"}>
                  {certificate.isPublic ? "Public" : "Private"}
                </Badge>
              </div>

              {/* Metadata */}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Added on {certificate.createdAt ? formatDate(certificate.createdAt) : "Unknown date"}
                </p>
                {certificate.updatedAt && certificate.updatedAt !== certificate.createdAt && (
                  <p className="text-xs text-muted-foreground">Updated on {formatDate(certificate.updatedAt)}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button asChild className="flex-1">
            <a href={`/certificate/${certificate._id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Full Page
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/api/certificates/${certificate._id}/file`} target="_blank" rel="noopener noreferrer">
              <Eye className="w-4 h-4 mr-2" />
              Open File
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/api/certificates/${certificate._id}/file`} download={certificate.fileName}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
