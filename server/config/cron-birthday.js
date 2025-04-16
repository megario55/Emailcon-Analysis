import Camhistory from "../models/Camhistory.js";
import mongoose from "mongoose";
import axios from "axios";
import cron from "node-cron";
import apiConfig from "../../my-app/src/apiconfig/apiConfig.js";

// ✅ Cron Initialization Log
console.log("🎉 Cron job started for annual birthday email campaigns");

cron.schedule('*/2 * * * *', async () => {
    console.log("\n🔁 Cron triggered at:", new Date().toISOString());

    try {
        // Get current time in Asia/Kolkata for comparison
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed
        const currentDate = now.getDate();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        console.log("🕒 Local Time (IST):", now.toString());
        console.log("📅 Today:", { currentYear, currentMonth: currentMonth + 1, currentDate, currentHour, currentMinute });

        const camhistories = await Camhistory.find({
            status: "Remainder On",
            campaignname: { $regex: /Birthday Remainder/i }
        });

        console.log(`📦 Total birthday campaigns fetched: ${camhistories.length}`);

        const matchingCampaigns = camhistories.filter(camhistory => {
            const scheduledDate = new Date(camhistory.scheduledTime);
            const scheduledDay = scheduledDate.getDate();
            const scheduledMonth = scheduledDate.getMonth();
            const scheduledHour = scheduledDate.getHours();
            const scheduledMinute = scheduledDate.getMinutes();

            console.log(`📌 Checking campaign: ${camhistory.campaignname}`);
            console.log("    ⏰ Scheduled at:", scheduledDate.toString());
            console.log("    🧭 Comparing to:", `${currentDate}-${currentMonth + 1} ${currentHour}:${currentMinute}`);

            const timeMatch = scheduledHour === currentHour && scheduledMinute === currentMinute;
            const dateMatch = scheduledDay === currentDate && scheduledMonth === currentMonth;
            const notSentThisYear = camhistory.lastSentYear !== currentYear;

            const result = timeMatch && dateMatch && notSentThisYear;
            console.log(`    ✅ Match: ${result}`);
            return result;
        });

        if (matchingCampaigns.length === 0) {
            console.log("⚠️ No matching campaigns to run at this time.");
            return;
        }

        console.log(`🚀 Matching campaigns to run: ${matchingCampaigns.length}`);

        await Promise.allSettled(matchingCampaigns.map(async (camhistory) => {
            const groupId = camhistory.groupId?.trim();
            if (!mongoose.Types.ObjectId.isValid(groupId)) {
                console.log(`❌ Invalid groupId for campaign: ${camhistory.campaignname}`);
                return;
            }

            console.log(`📨 Fetching students for groupId: ${groupId}`);
            const studentsResponse = await axios.get(`${apiConfig.baseURL}/api/stud/groups/${groupId}/students`);
            const allStudents = studentsResponse.data;

            const today = now;
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
                    console.log(`✅ Email sent to: ${student.Email}`);
                    sentEmails.push(student.Email);
                } catch (err) {
                    console.error(`❌ Failed to send to ${student.Email}:`, err.message);
                    failedEmails.push(student.Email);
                }
            }));

            const total = camhistory.totalcount;
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

            console.log(`🎉 Campaign "${camhistory.campaignname}" completed. Sent: ${sentEmails.length}, Failed: ${failedEmails.length}`);
        }));

    } catch (err) {
        console.error("❌ Error in annual birthday cron:", err.message);
    }
});
