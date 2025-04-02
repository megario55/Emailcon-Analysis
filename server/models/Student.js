import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
    Fname: {
        type: String,

    },
    Lname: {
        type: String,

    },
    Email: {
        type: String,
    },
    // Allow additional dynamic fields
    additionalFields: {
        type: Map,
        of: String,
    },
     group: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Group",
     },
     
},{ strict: false,versionKey: false });

const Student= mongoose.model('Student', studentSchema);

export default Student;

