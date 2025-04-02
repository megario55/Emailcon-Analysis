import mongoose from "mongoose";
// Email open schema
const emailOpenSchema = new mongoose.Schema({
  emailId: { type: String, required: true }, // Ensure emailId is stored
  userId: { type: String, required: true },
  campaignId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  sendTime: { type: Date, required: true }, // Ensure sendTime is saved
  ipAddress: String, // IP Address of the opener
  userAgent: String, // Device info
});

const EmailOpen = mongoose.model("EmailOpen", emailOpenSchema);
export default EmailOpen;
