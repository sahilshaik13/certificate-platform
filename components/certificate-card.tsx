"use client"

import type { Certificate } from "@/types/certificate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Building2, ExternalLink, Eye, Award } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface CertificateCardProps {
  certificate: Certificate
  showActions?: boolean
  onDelete?: (id: string) => void
}

export function CertificateCard({ certificate, showActions = false, onDelete }: CertificateCardProps) {
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

  const isExpired = certificate.expiryDate && new Date(certificate.expiryDate) < new Date()
  const skills = certificate.skills || [] // Ensure skills is always an array
  const views = certificate.views || 0

  return (
    <Card className={`h-full flex flex-col transition-all hover:shadow-lg ${isExpired ? "opacity-75" : ""}`}>
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight line-clamp-2">{certificate.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{certificate.issuer}</span>
            </div>
            {/* View Counter */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="w-3 h-3 flex-shrink-0" />
              <span>{formatViewCount(views)} views</span>
            </div>
          </div>
          {certificate.fileType?.includes("image") ? (
            <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img
                src={`/api/certificates/${certificate._id}/file?v=${certificate.fileUpdatedAt ? new Date(certificate.fileUpdatedAt).getTime() : certificate.updatedAt ? new Date(certificate.updatedAt).getTime() : Date.now()}`}
                alt={`${certificate.title} thumbnail`}
                className="w-full h-full object-cover"
                key={`${certificate._id}-${certificate.fileUpdatedAt || certificate.updatedAt || Date.now()}`}
                onLoad={() => console.log(`🖼️ Image loaded for ${certificate.title}`)}
                onError={(e) => {
                  console.error(`❌ Image failed to load for ${certificate.title}`)
                  // Fallback to timestamp-based cache busting
                  const img = e.target as HTMLImageElement
                  if (!img.src.includes("&fallback=")) {
                    img.src = `/api/certificates/${certificate._id}/file?v=${Date.now()}&fallback=true`
                  }
                }}
              />
            </div>
          ) : certificate.thumbnailUrl ? (
            <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <Image
                src={certificate.thumbnailUrl || "/placeholder.svg"}
                alt={`${certificate.title} thumbnail`}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
              <Award className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        {certificate.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 flex-shrink-0">{certificate.description}</p>
        )}

        <div className="space-y-2 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Issued: {formatDate(certificate.dateIssued)}</span>
          </div>

          {certificate.expiryDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className={`truncate ${isExpired ? "text-destructive" : ""}`}>
                Expires: {formatDate(certificate.expiryDate)}
                {isExpired && " (Expired)"}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 flex-shrink-0">
          {certificate.category && (
            <Badge variant="secondary" className="text-xs">
              {certificate.category}
            </Badge>
          )}
          {skills.slice(0, 2).map((skill, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {skills.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{skills.length - 2} more
            </Badge>
          )}
        </div>

        {/* Only show these buttons if not in admin mode (admin mode handles buttons separately) */}
        {!showActions && (
          <div className="flex gap-2 pt-2 mt-auto">
            <Button asChild size="sm" className="flex-1">
              <Link href={`/certificate/${certificate._id}`}>
                <Eye className="w-4 h-4 mr-2" />
                View
              </Link>
            </Button>

            <Button asChild variant="outline" size="sm">
              <a href={`/api/certificates/${certificate._id}/file`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        )}

        {/* Legacy delete button (kept for backward compatibility) */}
        {showActions && onDelete && (
          <Button variant="destructive" size="sm" className="w-full mt-auto" onClick={() => onDelete(certificate._id!)}>
            Delete
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
