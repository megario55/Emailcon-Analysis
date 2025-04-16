import Camhistory from "../models/Camhistory.js";
import mongoose from "mongoose";
import axios from "axios";
import cron from "node-cron";
import apiConfig from "../../my-app/src/apiconfig/apiConfig.js";

console.log("Cron job started for sending scheduled birthday emails.");
cron.schedule('0 * * * *', async () => {
    try {
        const nowUTC = new Date();
        const currentHour = nowUTC.getUTCHours();
        const currentYear = nowUTC.getUTCFullYear();

        console.log("Checking birthday campaigns at:", new Date().toLocaleString());

        const camhistories = await Camhistory.find({
            status: "Remainder On",
            campaignname: { $regex: /Birthday Remainder/i }
        });

        const matchingCampaigns = camhistories.filter(camhistory => {
            const scheduledHour = new Date(camhistory.scheduledTime).getUTCHours();
            return scheduledHour === currentHour;
        });

        if (matchingCampaigns.length === 0) {
            console.log("No birthday campaigns scheduled for this hour.");
            return;
        }

        await Promise.allSettled(matchingCampaigns.map(async (camhistory) => {
            const groupId = camhistory.groupId?.trim();
            if (!mongoose.Types.ObjectId.isValid(groupId)) return;

            const studentsResponse = await axios.get(`${apiConfig.baseURL}/api/stud/groups/${groupId}/students`);
            const allStudents = studentsResponse.data;

            const today = new Date();
            const todayDate = today.getDate();
            const todayMonth = today.getMonth() + 1;

            const birthdayStudents = allStudents.filter(student => {
                if (!student.Date) return false;

                const dob = new Date(student.Date);
                const lastSent = student.lastSentYear || 0; // Add this field in DB later

                return (
                    dob.getDate() === todayDate &&
                    (dob.getMonth() + 1) === todayMonth &&
                    lastSent < currentYear
                );
            });

            if (birthdayStudents.length === 0) {
                console.log("No students with birthdays today for campaign:", camhistory.campaignname);
                return;
            }

            let sentEmails = [];
            let failedEmails = [];

            await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`, { status: "Pending" });

            await Promise.allSettled(birthdayStudents.map(async (student) => {
                let personalizedSubject = camhistory.subject;
                Object.entries(student).forEach(([key, value]) => {
                    const regex = new RegExp(`\\{?${key}\\}?`, "g");
                    personalizedSubject = personalizedSubject.replace(regex, value != null ? String(value).trim() : "");
                });

                const personalizedContent = camhistory.previewContent.map(item => {
                    if (!item.content) return item;
                    let updatedContent = item.content;
                    Object.entries(student).forEach(([key, value]) => {
                        const regex = new RegExp(`\\{?${key}\\}?`, "g");
                        updatedContent = updatedContent.replace(regex, value != null ? String(value).trim() : "");
                    });
                    return { ...item, content: updatedContent };
                });

                const emailData = {
                    recipientEmail: student.Email,
                    subject: personalizedSubject,
                    body: JSON.stringify(personalizedContent),
                    bgColor: camhistory.bgColor,
                    previewtext: camhistory.previewtext,
                    aliasName: camhistory.aliasName,
                    attachments: camhistory.attachments,
                    userId: camhistory.user,
                    groupId: camhistory.groupname,
                    campaignId: camhistory._id,
                };

                try {
                    await axios.post(`${apiConfig.baseURL}/api/stud/sendbulkEmail`, emailData);
                    sentEmails.push(student.Email);

                    // Optional: Save lastSentYear in DB via API
                    await axios.put(`${apiConfig.baseURL}/api/stud/updateStudent/${student._id}`, {
                        lastSentYear: currentYear
                    });

                } catch (error) {
                    console.error(`Failed to send email to ${student.Email}:`, error.message);
                    failedEmails.push(student.Email);
                }
            }));

            const total = camhistory.totalEmails || 0;
            const progress = total > 0 ? Math.round((sentEmails.length / total) * 100) : 0;

            await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`, {
                sendcount: sentEmails.length,
                failedcount: failedEmails.length,
                sentEmails,
                failedEmails,
                status: "Remainder On",
                lastSentYear: currentYear,
                progress
            });

            console.log(`🎉 Campaign complete for ${camhistory.campaignname} | Sent: ${sentEmails.length}, Failed: ${failedEmails.length}`);
        }));

    } catch (error) {
        console.error("❌ Error in birthday cron job:", error);
    }
});
