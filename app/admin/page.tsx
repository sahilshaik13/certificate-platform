"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Certificate } from "@/types/certificate"
import { CertificateCard } from "@/components/certificate-card"
import { CertificateUploadForm } from "@/components/certificate-upload-form"
import { CertificateEditForm } from "@/components/certificate-edit-form"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Settings, BarChart3, Eye, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { CertificateViewer } from "@/components/certificate-viewer"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"

interface User {
  _id: string
  username: string
  role: string
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchCertificates()
    }
  }, [user])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else {
        router.push("/admin/login")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/admin/login")
    } finally {
      setLoading(false)
    }
  }

  const fetchCertificates = async () => {
    try {
      const response = await fetch("/api/certificates")
      const data = await response.json()
      setCertificates(data)
    } catch (error) {
      console.error("Error fetching certificates:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this certificate?")) {
      try {
        const response = await fetch(`/api/certificates/${id}`, {
          method: "DELETE",
        })

        if (response.ok) {
          setCertificates((prev) => prev.filter((cert) => cert._id !== id))
        }
      } catch (error) {
        console.error("Error deleting certificate:", error)
      }
    }
  }

  const handleUploadSuccess = () => {
    setShowUploadForm(false)
    fetchCertificates()
  }

  const handleEditSuccess = () => {
    fetchCertificates()
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/admin/login")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  const stats = {
    total: certificates.length || 0,
    public: certificates.filter((cert) => cert.isPublic).length || 0,
    private: certificates.filter((cert) => !cert.isPublic).length || 0,
    expired: certificates.filter((cert) => cert.expiryDate && new Date(cert.expiryDate) < new Date()).length || 0,
    totalViews: certificates.reduce((sum, cert) => sum + (cert.views || 0), 0),
    mostViewed:
      certificates.length > 0
        ? certificates.reduce((max, cert) => ((cert.views || 0) > (max.views || 0) ? cert : max), certificates[0])
        : null,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user.username}</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/">View Public Site</Link>
              </Button>
              <Button onClick={() => setShowUploadForm(!showUploadForm)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Certificate
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-gray-600">Total Certificates</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-2xl font-bold text-green-600">{stats.public}</p>
                <p className="text-gray-600">Public</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-2xl font-bold text-blue-600">{stats.private}</p>
                <p className="text-gray-600">Private</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                <p className="text-gray-600">Expired</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-2xl font-bold text-purple-600">{(stats.totalViews || 0).toLocaleString()}</p>
                <p className="text-gray-600">Total Views</p>
              </div>
            </div>

            {/* Upload Form */}
            {showUploadForm && <CertificateUploadForm onSuccess={handleUploadSuccess} />}

            {/* Recent Certificates */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Recent Certificates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {certificates.slice(0, 6).map((certificate) => (
                  <div key={certificate._id} className="flex flex-col space-y-3">
                    <div className="flex-1">
                      <CertificateCard certificate={certificate} showActions={false} onDelete={handleDelete} />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <CertificateViewer
                        certificate={certificate}
                        trigger={
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Preview</span>
                          </Button>
                        }
                      />
                      <CertificateEditForm
                        certificate={certificate}
                        onSuccess={handleEditSuccess}
                        trigger={
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                        }
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDelete(certificate._id!)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="certificates" className="space-y-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">All Certificates</h2>
                <div className="flex gap-2">
                  <Badge variant="outline">{stats.total} total</Badge>
                  <Badge variant="outline">{stats.public} public</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {certificates.map((certificate) => (
                  <div key={certificate._id} className="flex flex-col space-y-3">
                    <div className="flex-1">
                      <CertificateCard certificate={certificate} showActions={false} onDelete={handleDelete} />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <CertificateViewer
                        certificate={certificate}
                        trigger={
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Preview</span>
                          </Button>
                        }
                      />
                      <CertificateEditForm
                        certificate={certificate}
                        onSuccess={handleEditSuccess}
                        trigger={
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                        }
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDelete(certificate._id!)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Platform Settings</h2>
              <p className="text-gray-600">Settings and configuration options will be available here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
