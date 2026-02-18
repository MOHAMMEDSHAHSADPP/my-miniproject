const bcrypt = require("bcrypt");

(async () => {
  const pass = "admin123"; // your admin password
  const hashed = await bcrypt.hash(pass, 10);
  console.log("HASH:", hashed);
})();
