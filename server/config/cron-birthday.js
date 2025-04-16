import Camhistory from "../models/Camhistory.js";
import mongoose from "mongoose";
import axios from "axios";
import cron from "node-cron";
import apiConfig from "../../my-app/src/apiconfig/apiConfig.js";
import { DateTime } from "luxon"; // NEW: Luxon for timezone handling

// ✅ Cron Initialization Log
console.log("🎉 Cron job started for annual birthday email campaigns");

cron.schedule('*/2 * * * *', async () => {
    const now = DateTime.now().setZone("Asia/Kolkata");
    console.log("\n🔁 Cron triggered at (UTC):", new Date().toISOString());
    console.log("🕒 Local Time (IST):", now.toFormat("yyyy-MM-dd HH:mm:ss"));

    const currentYear = now.year;
    const currentMonth = now.month;
    const currentDate = now.day;
    const currentHour = now.hour;
    const currentMinute = now.minute;

    console.log("📅 Today:", { currentYear, currentMonth, currentDate, currentHour, currentMinute });

    try {
        const camhistories = await Camhistory.find({
            status: "Remainder On",
            campaignname: { $regex: /Birthday Remainder/i }
        });

        console.log(`📦 Total birthday campaigns fetched: ${camhistories.length}`);

        const matchingCampaigns = camhistories.filter(camhistory => {
            const scheduledIST = DateTime.fromISO(camhistory.scheduledTime).setZone("Asia/Kolkata");

            console.log(`📌 Checking campaign: ${camhistory.campaignname}`);
            console.log("    ⏰ Scheduled at (IST):", scheduledIST.toFormat("yyyy-MM-dd HH:mm:ss"));
            console.log("    🧭 Comparing to:", `${currentDate}-${currentMonth} ${currentHour}:${currentMinute}`);

            const timeMatch = scheduledIST.hour === currentHour && scheduledIST.minute === currentMinute;
            const dateMatch = scheduledIST.day === currentDate && scheduledIST.month === currentMonth;
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
            const todayDate = today.day;
            const todayMonth = today.month;

            const birthdayStudents = allStudents.filter(student => {
                if (!student.Date) return false;
                const dob = DateTime.fromISO(student.Date);
                return dob.day === todayDate && dob.month === todayMonth;
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
