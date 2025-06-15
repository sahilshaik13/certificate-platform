// Database setup script for MongoDB
const { MongoClient } = require("mongodb")
const crypto = require("crypto")

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex")
}

async function setupDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db("certificates")

    // Drop existing collections to start fresh
    try {
      await db.collection("users").drop()
      await db.collection("sessions").drop()
      await db.collection("certificates").drop()
      console.log("Dropped existing collections")
    } catch (error) {
      console.log("Collections didn't exist, continuing...")
    }

    // Create certificates collection with schema validation
    await db.createCollection("certificates", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["title", "issuer", "dateIssued", "createdAt"],
          properties: {
            title: { bsonType: "string" },
            issuer: { bsonType: "string" },
            description: { bsonType: "string" },
            dateIssued: { bsonType: "date" },
            expiryDate: { bsonType: "date" },
            fileData: { bsonType: ["string", "null"] },
            fileName: { bsonType: "string" },
            fileType: { bsonType: "string" },
            fileSize: { bsonType: "number" },
            thumbnailUrl: { bsonType: "string" },
            category: { bsonType: "string" },
            skills: { bsonType: "array" },
            isPublic: { bsonType: "bool" },
            createdAt: { bsonType: "date" },
            updatedAt: { bsonType: "date" },
          },
        },
      },
    })

    // Create users collection for admin authentication
    await db.createCollection("users", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["username", "passwordHash", "role", "createdAt"],
          properties: {
            username: { bsonType: "string" },
            passwordHash: { bsonType: "string" },
            role: { bsonType: "string", enum: ["admin"] },
            createdAt: { bsonType: "date" },
            lastLogin: { bsonType: "date" },
          },
        },
      },
    })

    // Create sessions collection
    await db.createCollection("sessions", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["sessionId", "userId", "expiresAt", "createdAt"],
          properties: {
            sessionId: { bsonType: "string" },
            userId: { bsonType: "objectId" },
            expiresAt: { bsonType: "date" },
            createdAt: { bsonType: "date" },
          },
        },
      },
    })

    // Create indexes
    await db.collection("users").createIndex({ username: 1 }, { unique: true })
    await db.collection("sessions").createIndex({ sessionId: 1 }, { unique: true })
    await db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

    // Create default admin user (password: admin123)
    const hashedPassword = hashPassword("admin123")

    await db.collection("users").insertOne({
      username: "admin",
      passwordHash: hashedPassword,
      role: "admin",
      createdAt: new Date(),
    })

    console.log("Admin user created - Username: admin, Password: admin123")

    // Create indexes for better performance
    await db.collection("certificates").createIndex({ title: "text", issuer: "text", description: "text" })
    await db.collection("certificates").createIndex({ category: 1 })
    await db.collection("certificates").createIndex({ dateIssued: -1 })
    await db.collection("certificates").createIndex({ isPublic: 1 })

    console.log("Database setup completed successfully")

    // Insert sample data
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

    await db.collection("certificates").insertMany(sampleCertificates)
    console.log("Sample certificates inserted")
  } catch (error) {
    console.error("Database setup failed:", error)
  } finally {
    await client.close()
  }
}

setupDatabase()
