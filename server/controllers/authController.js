import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { encryptPassword } from "../config/encryption.js";

export const signup = async (req, res) => {
  const { email, username, password, smtppassword } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email or username." });
    }

    // Encrypt SMTP password before storing
    const encryptedSmtpPassword = encryptPassword(smtppassword);

    const user = new User({
      email,
      username,
      password, // Ideally, hash this as well using bcrypt
      smtppassword: encryptedSmtpPassword,
    });

    await user.save();

    res
      .status(201)
      .json({
        message: "Your details are saved. Wait for account activation.",
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving user." });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).send("User not found.");
    if (!user.isActive) return res.status(403).send("Account not activated.");

    if (password !== user.password) {
      return res.status(401).send("Invalid credentials.");
    }

    const token = jwt.sign({ id: user._id }, "secret", { expiresIn: "1h" });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).send("Login failed.");
  }
};
