// Verify database setup
const { MongoClient } = require("mongodb")
const crypto = require("crypto")

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex")
}

async function verifySetup() {
  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()
    console.log("✅ Connected to MongoDB")

    const db = client.db("certificates")
    console.log("📁 Database:", db.databaseName)

    // Check collections
    const collections = await db.listCollections().toArray()
    console.log(
      "📋 Collections:",
      collections.map((c) => c.name),
    )

    // Check users
    const userCount = await db.collection("users").countDocuments()
    console.log("👥 Total users:", userCount)

    const users = await db.collection("users").find({}).toArray()
    console.log("👤 Users:")
    users.forEach((user) => {
      console.log(`   - ${user.username} (${user.role}) - Created: ${user.createdAt}`)
    })

    // Test admin login
    console.log("\n🔐 Testing admin login...")
    const adminUser = await db.collection("users").findOne({ username: "admin" })

    if (!adminUser) {
      console.log("❌ Admin user not found!")
      return
    }

    const testPassword = "admin123"
    const hashedTest = hashPassword(testPassword)
    const isValid = hashedTest === adminUser.passwordHash

    console.log("   Username: admin")
    console.log("   Password test:", isValid ? "✅ VALID" : "❌ INVALID")

    if (!isValid) {
      console.log("   Expected hash:", hashedTest)
      console.log("   Actual hash:", adminUser.passwordHash)
    }

    // Check certificates
    const certCount = await db.collection("certificates").countDocuments()
    console.log("\n📜 Total certificates:", certCount)

    const publicCerts = await db.collection("certificates").countDocuments({ isPublic: true })
    console.log("📜 Public certificates:", publicCerts)
  } catch (error) {
    console.error("💥 Verification failed:", error)
  } finally {
    await client.close()
  }
}

verifySetup()
