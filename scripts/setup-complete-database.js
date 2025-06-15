// Complete database setup with proper error handling
const { MongoClient } = require("mongodb")
const crypto = require("crypto")

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex")
}

async function setupCompleteDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()
    console.log("✅ Connected to MongoDB")

    const db = client.db("certificates")
    console.log("📁 Using database:", db.databaseName)

    // List existing collections
    const existingCollections = await db.listCollections().toArray()
    console.log(
      "📋 Existing collections:",
      existingCollections.map((c) => c.name),
    )

    // Create users collection if it doesn't exist
    const hasUsersCollection = existingCollections.some((c) => c.name === "users")

    if (!hasUsersCollection) {
      console.log("🔨 Creating users collection...")
      await db.createCollection("users")
    }

    // Create sessions collection if it doesn't exist
    const hasSessionsCollection = existingCollections.some((c) => c.name === "sessions")

    if (!hasSessionsCollection) {
      console.log("🔨 Creating sessions collection...")
      await db.createCollection("sessions")
    }

    // Create certificates collection if it doesn't exist
    const hasCertificatesCollection = existingCollections.some((c) => c.name === "certificates")

    if (!hasCertificatesCollection) {
      console.log("🔨 Creating certificates collection...")
      await db.createCollection("certificates")
    }

    // Create indexes
    try {
      await db.collection("users").createIndex({ username: 1 }, { unique: true })
      console.log("📊 Created unique index on users.username")
    } catch (error) {
      console.log("⚠️ Index on users.username already exists or failed:", error.message)
    }

    try {
      await db.collection("sessions").createIndex({ sessionId: 1 }, { unique: true })
      console.log("📊 Created unique index on sessions.sessionId")
    } catch (error) {
      console.log("⚠️ Index on sessions.sessionId already exists or failed:", error.message)
    }

    // Remove existing admin user if it exists
    const existingAdmin = await db.collection("users").findOne({ username: "admin" })
    if (existingAdmin) {
      console.log("🗑️ Removing existing admin user...")
      await db.collection("users").deleteOne({ username: "admin" })
    }

    // Create admin user
    const password = "admin123"
    const hashedPassword = hashPassword(password)

    console.log("👤 Creating admin user...")
    console.log("   Username: admin")
    console.log("   Password: admin123")
    console.log("   Hashed password:", hashedPassword)

    const adminUser = {
      username: "admin",
      passwordHash: hashedPassword,
      role: "admin",
      createdAt: new Date(),
    }

    const result = await db.collection("users").insertOne(adminUser)
    console.log("✅ Admin user created with ID:", result.insertedId)

    // Verify the user was created
    const createdUser = await db.collection("users").findOne({ username: "admin" })
    if (createdUser) {
      console.log("✅ Verification successful - Admin user exists")
      console.log("   ID:", createdUser._id)
      console.log("   Username:", createdUser.username)
      console.log("   Role:", createdUser.role)
      console.log("   Has password hash:", !!createdUser.passwordHash)
      console.log("   Created at:", createdUser.createdAt)
    } else {
      console.log("❌ Verification failed - Admin user not found after creation")
    }

    // Test password verification
    console.log("🔐 Testing password verification...")
    const testHash = hashPassword("admin123")
    const passwordMatch = testHash === createdUser.passwordHash
    console.log("   Test hash:", testHash)
    console.log("   Stored hash:", createdUser.passwordHash)
    console.log("   Passwords match:", passwordMatch ? "✅ YES" : "❌ NO")

    // Count total users
    const userCount = await db.collection("users").countDocuments()
    console.log("👥 Total users in database:", userCount)

    // Insert sample certificates
    console.log("📜 Creating sample certificates...")

    const sampleCertificates = [
      {
        title: "AWS Certified Solutions Architect",
        issuer: "Amazon Web Services",
        description: "Validates expertise in designing distributed systems on AWS",
        dateIssued: new Date("2024-01-15"),
        expiryDate: new Date("2027-01-15"),
        fileData: null,
        fileName: "aws-cert.pdf",
        fileType: "application/pdf",
        fileSize: 0,
        thumbnailUrl: "/placeholder.svg?height=300&width=400",
        category: "Cloud Computing",
        skills: ["AWS", "Cloud Architecture", "System Design"],
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Google Cloud Professional Developer",
        issuer: "Google Cloud",
        description: "Demonstrates proficiency in developing scalable applications on Google Cloud",
        dateIssued: new Date("2024-03-10"),
        expiryDate: new Date("2026-03-10"),
        fileData: null,
        fileName: "gcp-cert.pdf",
        fileType: "application/pdf",
        fileSize: 0,
        thumbnailUrl: "/placeholder.svg?height=300&width=400",
        category: "Cloud Computing",
        skills: ["GCP", "Kubernetes", "DevOps"],
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    // Clear existing certificates
    await db.collection("certificates").deleteMany({})

    // Insert sample certificates
    const certResult = await db.collection("certificates").insertMany(sampleCertificates)
    console.log("✅ Sample certificates created:", certResult.insertedIds)

    console.log("\n🎉 Database setup completed successfully!")
    console.log("📝 Login credentials:")
    console.log("   Username: admin")
    console.log("   Password: admin123")
  } catch (error) {
    console.error("💥 Database setup failed:", error)
    console.error("Stack trace:", error.stack)
  } finally {
    await client.close()
    console.log("🔌 Database connection closed")
  }
}

setupCompleteDatabase()
