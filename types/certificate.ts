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
  category: string
  skills: string[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
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
