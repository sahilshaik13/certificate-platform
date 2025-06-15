// Test login credentials
const { MongoClient } = require("mongodb")
const crypto = require("crypto")

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex")
}

async function testLogin() {
  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db("certificates")

    // Find the admin user
    const user = await db.collection("users").findOne({ username: "admin" })

    if (!user) {
      console.log("❌ Admin user not found!")
      return
    }

    console.log("✅ Admin user found")
    console.log("User data:", {
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      hasPasswordHash: !!user.passwordHash,
    })

    // Test password verification
    const testPassword = "admin123"
    const hashedTestPassword = hashPassword(testPassword)
    const storedHash = user.passwordHash

    console.log("Password verification:")
    console.log("Test password:", testPassword)
    console.log("Hashed test password:", hashedTestPassword)
    console.log("Stored hash:", storedHash)
    console.log("Passwords match:", hashedTestPassword === storedHash ? "✅ YES" : "❌ NO")
  } catch (error) {
    console.error("Error testing login:", error)
  } finally {
    await client.close()
  }
}

testLogin()
