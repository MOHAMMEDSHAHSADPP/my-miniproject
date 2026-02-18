const bcrypt = require("bcryptjs");
require("dotenv").config();

const connectDB = require("../Models/db");
const User = require("../Models/User");

async function run() {
  await connectDB();

  const superEmail = "superadmin@urbanconnect.com";
  const adminEmail = "admin.kuttippuram@urbanconnect.com";

  const superPassword = "Super@12345";
  const adminPassword = "Admin@12345";

  const superHash = await bcrypt.hash(superPassword, 10);
  const adminHash = await bcrypt.hash(adminPassword, 10);

  await User.updateOne(
    { email: superEmail },
    {
      $set: {
        name: "Super Admin",
        email: superEmail,
        password: superHash,
        isAdmin: true,
        role: "super_admin",
        townName: "",
        townSlug: "",
        isBanned: false,
      },
    },
    { upsert: true }
  );

  await User.updateOne(
    { email: adminEmail },
    {
      $set: {
        name: "Town Admin",
        email: adminEmail,
        password: adminHash,
        isAdmin: true,
        role: "admin",
        townName: "Kuttippuram",
        townSlug: "kuttippuram",
        isBanned: false,
      },
    },
    { upsert: true }
  );

  console.log("✅ Admin users seeded/updated");
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ seed error:", e);
  process.exit(1);
});