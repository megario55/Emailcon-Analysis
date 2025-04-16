import mongoose from "mongoose";

const camhistorySchema = new mongoose.Schema({
    campaignname: {
        type: String,
        required: true,
    },
    groupname: {
        type: String,
        required: true,
    },
    totalcount: {
        type: String,
        required: true,
    },
    progress: {
        type: String,
        required: true,
    },
    aliasName: {
        type: String,
        required: true,
    },
    sendcount: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    previewtext: {
        type: String,
        required: true,
    },
    failedcount: {
        type: String,
    },
    status: {
        type: String,
        required: true,
    },
    senddate: {
        type: String,
        required: true,
    },
    sentEmails: {
        type: [String],
    },
    failedEmails: {
        type: [String],
    },
    previewContent: {
        type: Array,
        required: true,
    },
    attachments: [
        {
          originalName: { type: String},
          fileUrl: { type: String},
        }
      ],
    bgColor: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    scheduledTime: {
        type: Date,
    },
    recipients: {
        type: String,
    },
    groupId: {
        type: String,
    },
    exceldata: [{
        Fname: {
            type: String,
        },
        Lname: {
            type: String,
        },
        Email: {
            type: String,
        },
        additionalFields: {
            type: Map,
            of: String,
        },
    }],
},{
    strict: false
}, {
    timestamps: true, // Automatically stores createdAt and updatedAt
});

const Camhistory = mongoose.model("Camhistory", camhistorySchema);
export default Camhistory;
