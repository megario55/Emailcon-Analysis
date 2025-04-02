import crypto from "crypto";

// Use a fixed salt for consistent key derivation
const shortKey = "8bytekey";
const salt = Buffer.from("fixed-salt-value", "utf-8"); // Keep this secret
const secretKey = crypto.pbkdf2Sync(shortKey, salt, 100000, 32, "sha256");

export function encryptPassword(password) {
  const iv = crypto.randomBytes(16);  // Generate a 16-byte IV
  const cipher = crypto.createCipheriv("aes-256-cbc", secretKey, iv);
  let encrypted = cipher.update(password, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;  // Store IV and encrypted data
}

export function decryptPassword(encryptedPassword) {
  try {
    const [ivHex, encrypted] = encryptedPassword.split(":");

    if (!ivHex || !encrypted) {
      throw new Error("Invalid encrypted password format.");
    }

    const iv = Buffer.from(ivHex, "hex");

    if (iv.length !== 16) {
      throw new Error(`Invalid IV length: ${iv.length}. It must be 16 bytes.`);
    }

    const decipher = crypto.createDecipheriv("aes-256-cbc", secretKey, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error.message);
    throw new Error("Failed to decrypt password.");
  }
}
