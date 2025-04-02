import mongoose from 'mongoose';
const ClickTrackingSchema = new mongoose.Schema({
    emailId: { type: String, required: true }, // Ensure emailId is stored
    userId: { type: String, required: true },
    campaignId: { type: String, required: true },
    clickedUrl: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String },
  });
  const ClickTracking= mongoose.model('ClickTracking', ClickTrackingSchema);
  export default ClickTracking;
