"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Certificate } from "@/types/certificate"
import { Upload, Loader2, Edit } from "lucide-react"

const categories = [
  "Cloud Computing",
  "Programming",
  "Data Science",
  "Cybersecurity",
  "Project Management",
  "Design",
  "Marketing",
  "Other",
]

interface CertificateEditFormProps {
  certificate: Certificate
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function CertificateEditForm({ certificate, onSuccess, trigger }: CertificateEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    title: certificate.title || "",
    issuer: certificate.issuer || "",
    description: certificate.description || "",
    dateIssued: certificate.dateIssued ? new Date(certificate.dateIssued).toISOString().split("T")[0] : "",
    expiryDate: certificate.expiryDate ? new Date(certificate.expiryDate).toISOString().split("T")[0] : "",
    category: certificate.category || "",
    skills: Array.isArray(certificate.skills) ? certificate.skills.join(", ") : "",
    isPublic: certificate.isPublic ?? true,
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()

      if (file) {
        formDataToSend.append("file", file)
      }

      formDataToSend.append("data", JSON.stringify(formData))

      const response = await fetch(`/api/certificates/${certificate._id}`, {
        method: "PUT",
        body: formDataToSend,
        // Add cache-busting headers
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (response.ok) {
        setIsOpen(false)
        setFile(null)

        // Clear all image caches by adding timestamp to all image URLs
        const timestamp = Date.now()

        // Force clear browser cache for this certificate's images
        const imageUrls = [
          `/api/certificates/${certificate._id}/file`,
          `/api/certificates/${certificate._id}/file?t=${timestamp}`,
        ]

        // Preload new image to force cache refresh
        imageUrls.forEach((url) => {
          const img = new Image()
          img.src = url
        })

        // Wait a bit longer to ensure database write is complete
        setTimeout(() => {
          onSuccess?.()
          // Force a hard refresh of the current page
          window.location.reload()
        }, 1000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update certificate")
      }
    } catch (error) {
      console.error("Error updating certificate:", error)
      alert("Failed to update certificate. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Edit className="w-4 h-4 mr-2" />
      Edit
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Certificate</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Certificate Title*</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., AWS Certified Solutions Architect"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-issuer">Issuing Organization*</Label>
              <Input
                id="edit-issuer"
                value={formData.issuer}
                onChange={(e) => handleInputChange("issuer", e.target.value)}
                placeholder="e.g., Amazon Web Services"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description of the certificate..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-dateIssued">Date Issued*</Label>
              <Input
                id="edit-dateIssued"
                type="date"
                value={formData.dateIssued}
                onChange={(e) => handleInputChange("dateIssued", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="edit-expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange("expiryDate", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category*</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-skills">Skills (comma-separated)</Label>
              <Input
                id="edit-skills"
                value={formData.skills}
                onChange={(e) => handleInputChange("skills", e.target.value)}
                placeholder="e.g., AWS, Cloud Architecture, System Design"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-file">Replace Certificate File (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input id="edit-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} />
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to keep current file. Supported formats: PDF, JPG, PNG, WebP (Max 50MB)
            </p>
            {certificate.fileName && (
              <p className="text-xs text-muted-foreground">Current file: {certificate.fileName}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => handleInputChange("isPublic", checked)}
            />
            <Label htmlFor="edit-isPublic">Make this certificate public</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Certificate"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
