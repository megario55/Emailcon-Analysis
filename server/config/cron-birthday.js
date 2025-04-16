import Camhistory from "../models/Camhistory.js";
import mongoose from "mongoose";
import axios from "axios";
import cron from "node-cron";
import apiConfig from "../../my-app/src/apiconfig/apiConfig.js";

console.log("🎉 Cron job started for annual birthday email campaigns");

// cron.schedule('0 * * * *', async () => {
cron.schedule('*/2 * * * *', async () => {

    try {
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth(); // 0-indexed
        const currentDate = now.getUTCDate();
        const currentHour = now.getUTCHours();
        const currentMinute = now.getUTCMinutes();

        const camhistories = await Camhistory.find({
            status: "Remainder On",
            campaignname: { $regex: /Birthday Remainder/i }
        });

        const matchingCampaigns = camhistories.filter(camhistory => {
            const scheduledDate = new Date(camhistory.scheduledTime);
            const scheduledDay = scheduledDate.getUTCDate();
            const scheduledMonth = scheduledDate.getUTCMonth();
            const scheduledHour = scheduledDate.getUTCHours();
            const scheduledMinute = scheduledDate.getUTCMinutes();

            const timeMatch = scheduledHour === currentHour && scheduledMinute === currentMinute;
            const dateMatch = scheduledDay === currentDate && scheduledMonth === currentMonth;
            const notSentThisYear = camhistory.lastSentYear !== currentYear;

            return timeMatch && dateMatch && notSentThisYear;
        });

        if (matchingCampaigns.length === 0) {
            console.log("No annual birthday campaigns to send at this time.");
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
                return dob.getDate() === todayDate && (dob.getMonth() + 1) === todayMonth;
            });

            if (birthdayStudents.length === 0) {
                console.log(`🎈 No birthdays today for campaign: ${camhistory.campaignname}`);
                return;
            }

            let sentEmails = [], failedEmails = [];

            await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`, { status: "Pending" });

            await Promise.allSettled(birthdayStudents.map(async (student) => {
                let subject = camhistory.subject;
                Object.entries(student).forEach(([key, value]) => {
                    const regex = new RegExp(`\\{?${key}\\}?`, "g");
                    subject = subject.replace(regex, value != null ? String(value).trim() : "");
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
                    subject,
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
                } catch (err) {
                    console.error(`❌ Failed to send to ${student.Email}:`, err.message);
                    failedEmails.push(student.Email);
                }
            }));

            const total = camhistory.totalcount; // must be set in DB at campaign setup
            const progress = total > 0 ? Math.round((sentEmails.length / total) * 100) : 0;            

            await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`, {
                sendcount: sentEmails.length,
                failedcount: failedEmails.length,
                sentEmails,
                failedEmails,
                status: "Remainder On", // So it's active next year again
                lastSentYear: currentYear, // 👈 Mark as sent this year
                progress
            });

            console.log(`✅ Annual campaign complete for ${camhistory.campaignname}. Sent: ${sentEmails.length}, Failed: ${failedEmails.length}`);
        }));

    } catch (err) {
        console.error("❌ Error in annual birthday cron:", err.message);
    }
});
