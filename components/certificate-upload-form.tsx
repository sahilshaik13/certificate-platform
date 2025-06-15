"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CertificateFormData } from "@/types/certificate"
import { Upload, Loader2 } from "lucide-react"

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

interface CertificateUploadFormProps {
  onSuccess?: () => void
}

export function CertificateUploadForm({ onSuccess }: CertificateUploadFormProps) {
  const [formData, setFormData] = useState<CertificateFormData>({
    title: "",
    issuer: "",
    description: "",
    dateIssued: "",
    expiryDate: "",
    category: "",
    skills: "",
    isPublic: true,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleInputChange = (field: keyof CertificateFormData, value: string | boolean) => {
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
        // For images, we'll keep original quality
        // For PDFs, we'll store as-is
        if (file.type.startsWith("image/")) {
          // Keep original image quality - no compression
          formDataToSend.append("file", file)
        } else {
          // For PDFs and other files, store as-is
          formDataToSend.append("file", file)
        }
      }

      formDataToSend.append("data", JSON.stringify(formData))

      const response = await fetch("/api/certificates", {
        method: "POST",
        body: formDataToSend,
      })

      if (response.ok) {
        // Reset form
        setFormData({
          title: "",
          issuer: "",
          description: "",
          dateIssued: "",
          expiryDate: "",
          category: "",
          skills: "",
          isPublic: true,
        })
        setFile(null)
        // Reset file input
        const fileInput = document.getElementById("file") as HTMLInputElement
        if (fileInput) fileInput.value = ""

        onSuccess?.()
      } else {
        throw new Error("Failed to upload certificate")
      }
    } catch (error) {
      console.error("Error uploading certificate:", error)
      alert("Failed to upload certificate. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Certificate</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Certificate Title*</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., AWS Certified Solutions Architect"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuer">Issuing Organization*</Label>
              <Input
                id="issuer"
                value={formData.issuer}
                onChange={(e) => handleInputChange("issuer", e.target.value)}
                placeholder="e.g., Amazon Web Services"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description of the certificate..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateIssued">Date Issued*</Label>
              <Input
                id="dateIssued"
                type="date"
                value={formData.dateIssued}
                onChange={(e) => handleInputChange("dateIssued", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange("expiryDate", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category*</Label>
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
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                value={formData.skills}
                onChange={(e) => handleInputChange("skills", e.target.value)}
                placeholder="e.g., AWS, Cloud Architecture, System Design"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Certificate File*</Label>
            <div className="flex items-center gap-2">
              <Input id="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} required />
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, JPG, PNG, WebP (Max 50MB for high quality)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => handleInputChange("isPublic", checked)}
            />
            <Label htmlFor="isPublic">Make this certificate public</Label>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Certificate"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
