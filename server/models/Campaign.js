import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema({
    camname: {
        type: String,
        required: true,

    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

}, {
    timestamps: true
});


const Campaign = mongoose.model("Campaign", campaignSchema);
export default Campaign;
