import express from "express";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { signJwt } from "../lib/jwt.js";
import { sendOtpEmail } from "../lib/mailer.js";
import { getUsersCollection, getOtpCollection } from "../models/users.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

function validateEmail(email) {
  return /.+@.+\..+/.test(email);
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, firstName, lastName, email, password } = req.body || {};
    const combinedName = (typeof name === "string" && name.trim())
      ? name.trim()
      : `${firstName || ""} ${lastName || ""}`.trim();
    if (!combinedName || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email" });
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const users = await getUsersCollection();
    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const userDoc = {
      name: combinedName,
      ...(firstName ? { firstName: String(firstName) } : {}),
      ...(lastName ? { lastName: String(lastName) } : {}),
      email: email.toLowerCase(),
      passwordHash: hashed,
      createdAt: new Date()
    };
    const insertRes = await users.insertOne(userDoc);
    const userId = insertRes.insertedId.toString();
    const token = signJwt({ userId, email: userDoc.email, name: userDoc.name });
    return res.status(201).json({ token, user: { id: userId, name: userDoc.name, email: userDoc.email } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const users = await getUsersCollection();
    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = signJwt({ userId: user._id.toString(), email: user.email, name: user.name });
    return res.json({ token, user: { id: user._id.toString(), name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email" });

    const users = await getUsersCollection();
    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(200).json({ message: "If the email exists, an OTP has been sent" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const otps = await getOtpCollection();
    await otps.deleteMany({ email: email.toLowerCase() });
    await otps.insertOne({ email: email.toLowerCase(), otp: otpCode, expiresAt, createdAt: new Date() });
    await sendOtpEmail({ to: email.toLowerCase(), otp: otpCode });
    return res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body || {};
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, OTP and newPassword are required" });
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    const otps = await getOtpCollection();
    const record = await otps.findOne({ email: email.toLowerCase(), otp });
    if (!record) return res.status(400).json({ error: "Invalid OTP" });
    if (new Date(record.expiresAt).getTime() < Date.now()) return res.status(400).json({ error: "OTP expired" });

    const users = await getUsersCollection();
    const hashed = await bcrypt.hash(newPassword, 10);
    const updateRes = await users.updateOne({ email: email.toLowerCase() }, { $set: { passwordHash: hashed } });
    await otps.deleteMany({ email: email.toLowerCase() });
    if (updateRes.matchedCount === 0) return res.status(404).json({ error: "User not found" });
    return res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ----- Profile -----
// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const users = await getUsersCollection();
    const id = req.user && req.user.userId ? req.user.userId : null;
    if (!id) return res.status(401).json({ error: "Unauthorized" });
    const user = await users.findOne(
      { _id: new ObjectId(id) },
      { projection: { name: 1, email: 1, firstName: 1, lastName: 1 } }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ id: user._id.toString(), name: user.name, email: user.email, firstName: user.firstName || null, lastName: user.lastName || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/auth/me
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const id = req.user && req.user.userId ? req.user.userId : null;
    if (!id) return res.status(401).json({ error: "Unauthorized" });
    const { name, firstName, lastName, email, currentPassword, newPassword } = req.body || {};

    const updates = {};
    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (firstName !== undefined) updates.firstName = String(firstName || "");
    if (lastName !== undefined) updates.lastName = String(lastName || "");
    if (typeof email === "string" && email.trim()) {
      if (!/.+@.+\..+/.test(email)) return res.status(400).json({ error: "Invalid email" });
      updates.email = email.toLowerCase();
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ _id: new ObjectId(id) });
    if (!user) return res.status(404).json({ error: "User not found" });

    // If only first/last provided without name, update name to combined
    if (!updates.name && ("firstName" in updates || "lastName" in updates)) {
      const newFirst = ("firstName" in updates) ? updates.firstName : (user.firstName || "");
      const newLast = ("lastName" in updates) ? updates.lastName : (user.lastName || "");
      const combined = `${newFirst || ""} ${newLast || ""}`.trim();
      if (combined) updates.name = combined;
    }

    if (newPassword !== undefined && String(newPassword || "").length > 0) {
      if (typeof newPassword !== "string" || newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      updates.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No changes provided" });
    }

    const result = await users.updateOne({ _id: new ObjectId(id) }, { $set: updates });
    if (result.matchedCount === 0) return res.status(404).json({ error: "User not found" });

    const updated = await users.findOne({ _id: new ObjectId(id) }, { projection: { name: 1, email: 1, firstName: 1, lastName: 1 } });
    return res.json({ id, name: updated.name, email: updated.email, firstName: updated.firstName || null, lastName: updated.lastName || null });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: "Email already in use" });
    }
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;


