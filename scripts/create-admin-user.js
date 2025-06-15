// Simple script to create admin user
const { MongoClient } = require("mongodb")
const crypto = require("crypto")

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex")
}

async function createAdminUser() {
  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db("certificates")

    // Check if admin user already exists
    const existingUser = await db.collection("users").findOne({ username: "admin" })

    if (existingUser) {
      console.log("Admin user already exists, deleting and recreating...")
      await db.collection("users").deleteOne({ username: "admin" })
    }

    // Create the admin user
    const hashedPassword = hashPassword("admin123")
    console.log("Hashed password:", hashedPassword)

    const result = await db.collection("users").insertOne({
      username: "admin",
      passwordHash: hashedPassword,
      role: "admin",
      createdAt: new Date(),
    })

    console.log("Admin user created successfully with ID:", result.insertedId)

    // Verify the user was created
    const createdUser = await db.collection("users").findOne({ username: "admin" })
    console.log("Verification - User found:", createdUser ? "YES" : "NO")

    if (createdUser) {
      console.log("User details:", {
        username: createdUser.username,
        role: createdUser.role,
        hasPassword: !!createdUser.passwordHash,
      })
    }
  } catch (error) {
    console.error("Error creating admin user:", error)
  } finally {
    await client.close()
  }
}

createAdminUser()
