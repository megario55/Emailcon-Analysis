import axios from "axios";
import apiConfig from "../../my-app/src/apiconfig/apiConfig.js";
import Camhistory from "../models/Camhistory.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            message: "Method Not Allowed"
        });
    }

     try {
         console.log("Checking for scheduled emails...");
         const nowUTC = new Date();
         nowUTC.setSeconds(0, 0); // Round to the nearest minute
         const nextMinute = new Date(nowUTC);
         nextMinute.setMinutes(nextMinute.getMinutes() + 1);
         console.log("Checking for scheduled emails at:", nowUTC.toISOString());

         const camhistories = await Camhistory.find({
             status: "Scheduled On",
             scheduledTime: {
                 $gte: nowUTC.toISOString(),
                 $lt: nextMinute.toISOString()
             }
         });

         if (camhistories.length === 0) {
             console.log("No scheduled emails found.");
             return;
         }

         let sentEmails = [];
         let failedEmails = [];

         for (const camhistory of camhistories) {
             console.log(`Processing scheduled email for user: ${camhistory.user}`);
             const groupId = camhistory.groupId?.trim(); // Trim to avoid spaces affecting checks

             // **First Condition**: If `groupId` is missing or "no group"
             if (!groupId || groupId.toLowerCase() === "no group") {
                 console.log("No group found, sending emails directly.");

                 await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`, {
                     status: "Pending"
                 });

                 let recipients = camhistory.recipients.split(",").map(email => email.trim());

                 for (const email of recipients) {
                     const personalizedContent = camhistory.previewContent.map((item) => {
                         return item.content ? {
                             ...item,
                             content: item.content.replace(/\{?Email\}?/g, email)
                         } : item;
                     });

                     const emailData = {
                         recipientEmail: email,
                         subject: camhistory.subject,
                         body: JSON.stringify(personalizedContent),
                         bgColor: camhistory.bgColor,
                         previewtext: camhistory.previewtext,
                         userId: camhistory.user,
                         groupId: camhistory.groupname,
                         campaignId: camhistory._id,
                     };

                     try {
                         await axios.post(`${apiConfig.baseURL}/api/stud/sendbulkEmail`, emailData);
                         sentEmails.push(email);
                     } catch (error) {
                         console.error(`Failed to send email to ${email}:`, error);
                         failedEmails.push(email);
                     }
                 }

                 // Update status
                 const finalStatus = failedEmails.length > 0 ? "Failed" : "Success";
                 await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`, {
                     sendcount: sentEmails.length,
                     sentEmails,
                     failedEmails: failedEmails.length > 0 ? failedEmails : [],
                     failedcount: failedEmails.length,
                     status: finalStatus,
                 });

                 console.log(`Emails sent successfully for user: ${camhistory.user}`);
                 continue;
             }

             // **Second Condition**: If `groupId` is "No id", send using excel data
             if (groupId.toLowerCase() === "no id") {
                 console.log("No valid ID found, resending only to failed emails.");

                 await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`, {
                     status: "Pending"
                 });

                 for (const student of camhistory.exceldata) {
                     const personalizedContent = camhistory.previewContent.map((item) => {
                         if (!item.content) return item;
                         let updatedContent = item.content;
                         const studentData = student._doc || student;

                         Object.entries(studentData).forEach(([key, value]) => {
                             const cleanKey = key.trim();
                             const cellValue = value != null ? String(value).trim() : "";
                             const placeholderRegex = new RegExp(`\\{${cleanKey}\\}`, "gi");
                             updatedContent = updatedContent.replace(placeholderRegex, cellValue);
                         });

                         return {
                             ...item,
                             content: updatedContent
                         };
                     });

                     const emailData = {
                         recipientEmail: student.Email,
                         subject: camhistory.subject,
                         body: JSON.stringify(personalizedContent),
                         bgColor: camhistory.bgColor,
                         previewtext: camhistory.previewtext,
                         userId: camhistory.user,
                         groupId: camhistory.groupname,
                         campaignId: camhistory._id,
                     };

                     try {
                         await axios.post(`${apiConfig.baseURL}/api/stud/sendbulkEmail`, emailData);
                         sentEmails.push(student.Email);
                     } catch (error) {
                         console.error(`Failed to send email to ${student.Email}:`, error);
                         failedEmails.push(student.Email);
                     }
                 }

                 const finalStatus = failedEmails.length > 0 ? "Failed" : "Success";
                 await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`, {
                     sendcount: sentEmails.length,
                     sentEmails,
                     failedEmails: failedEmails.length > 0 ? failedEmails : [],
                     failedcount: failedEmails.length,
                     status: finalStatus,
                 });

                 console.log(`Emails sent successfully for user: ${camhistory.user}`);
                 continue;
             }

             // **Third Condition**: If `groupId` is a valid MongoDB ObjectId, send emails through the group
             if (mongoose.Types.ObjectId.isValid(groupId)) {
                 console.log("Valid group ID found, sending emails through group.");

                 const studentsResponse = await axios.get(`${apiConfig.baseURL}/api/stud/groups/${groupId}/students`);
                 const students = studentsResponse.data;

                 await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`, {
                     status: "Pending"
                 });

                 for (const student of students) {
                     const personalizedContent = camhistory.previewContent.map((item) => {
                         const personalizedItem = {
                             ...item
                         };

                         if (item.content) {
                             Object.entries(student).forEach(([key, value]) => {
                                 const placeholderRegex = new RegExp(`\\{?${key}\\}?`, "g");
                                 const cellValue = value != null ? String(value).trim() : "";
                                 personalizedItem.content = personalizedItem.content.replace(placeholderRegex, cellValue);
                             });
                         }
                         return personalizedItem;
                     });

                     const emailData = {
                         recipientEmail: student.Email,
                         subject: camhistory.subject,
                         body: JSON.stringify(personalizedContent),
                         bgColor: camhistory.bgColor,
                         previewtext: camhistory.previewtext,
                         userId: camhistory.user,
                         groupId: camhistory.groupname,
                         campaignId: camhistory._id,
                     };

                     try {
                         await axios.post(`${apiConfig.baseURL}/api/stud/sendbulkEmail`, emailData);
                         sentEmails.push(student.Email);
                     } catch (error) {
                         console.error(`Failed to send email to ${student.Email}:`, error);
                         failedEmails.push(student.Email);
                     }
                 }

                 const finalStatus = failedEmails.length > 0 ? "Failed" : "Success";
                 await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`, {
                     sendcount: sentEmails.length,
                     sentEmails,
                     failedEmails: failedEmails.length > 0 ? failedEmails : [],
                     failedcount: failedEmails.length,
                     status: finalStatus,
                 });

                 console.log(`Emails sent successfully for user: ${camhistory.user}`);
             }
         }
     } catch (error) {
         console.error("Error in cron job:", error);
     }

}
