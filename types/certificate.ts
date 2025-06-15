export interface Certificate {
  _id?: string
  title: string
  issuer: string
  description?: string
  dateIssued: Date
  expiryDate?: Date
  fileData?: string // Base64 encoded file data
  fileName?: string
  fileType?: string
  fileSize?: number
  thumbnailUrl?: string
  category?: string
  skills?: string[] // Make skills optional
  isPublic: boolean
  views?: number // Add views counter
  lastViewed?: Date // Add last viewed timestamp
  createdAt: Date
  updatedAt: Date
  fileUpdatedAt?: Date // Track when file was last updated
}

export interface CertificateFormData {
  title: string
  issuer: string
  description: string
  dateIssued: string
  expiryDate: string
  category: string
  skills: string
  isPublic: boolean
}
