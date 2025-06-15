"use client"

import { useEffect, useState } from "react"
import type { Certificate } from "@/types/certificate"
import { CertificateCard } from "@/components/certificate-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Award, Users, Calendar } from "lucide-react"

export default function HomePage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)

  const categories = Array.from(new Set(certificates.map((cert) => cert.category).filter(Boolean)))

  useEffect(() => {
    fetchCertificates()
  }, [])

  useEffect(() => {
    filterCertificates()
  }, [certificates, searchTerm, selectedCategory])

  // Track site visit
  useEffect(() => {
    const trackVisit = async () => {
      try {
        await fetch("/api/views", { method: "POST" })
      } catch (error) {
        console.error("Error tracking visit:", error)
      }
    }

    trackVisit()
  }, [])

  const fetchCertificates = async () => {
    try {
      const response = await fetch("/api/certificates?public=true")
      const data = await response.json()
      setCertificates(data)
    } catch (error) {
      console.error("Error fetching certificates:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterCertificates = () => {
    let filtered = certificates

    if (selectedCategory !== "all") {
      filtered = filtered.filter((cert) => cert.category === selectedCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (cert) =>
          cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cert.issuer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (cert.skills || []).some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    setFilteredCertificates(filtered)
  }

  const stats = {
    total: certificates.length,
    categories: categories.length,
    recent: certificates.filter((cert) => {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      return new Date(cert.dateIssued) > sixMonthsAgo
    }).length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">Loading certificates...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Certificate Portfolio</h1>
              <p className="text-gray-600 mt-1">Professional certifications and achievements</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-gray-600">Total Certificates</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.categories}</p>
                <p className="text-gray-600">Categories</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.recent}</p>
                <p className="text-gray-600">Recent (6 months)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search certificates, skills, or issuers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchTerm}
                <button onClick={() => setSearchTerm("")} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory("all")} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            )}
          </div>
        </div>

        {/* Certificates Grid */}
        {filteredCertificates.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No certificates found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((certificate) => (
              <CertificateCard key={certificate._id} certificate={certificate} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
