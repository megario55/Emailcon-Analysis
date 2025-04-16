import Camhistory from "../models/Camhistory.js";
import mongoose from "mongoose";
import axios from "axios";
import cron from "node-cron";
import apiConfig from "../../my-app/src/apiconfig/apiConfig.js";

console.log("🎉 Cron job started for annual birthday email campaigns");

cron.schedule('*/1 * * * *', async () => {
    const triggeredAt = new Date();
    console.log(`\n🔁 Cron triggered at (UTC): ${triggeredAt.toISOString()}`);

    try {
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const currentMonth = now.getUTCMonth(); // 0-indexed
        const currentDate = now.getUTCDate();
        const currentHour = now.getUTCHours();
        const currentMinute = now.getUTCMinutes();

        console.log("🕒 Current UTC Time:", now.toISOString());
        console.log("📅 Today (UTC):", {
            currentYear,
            currentMonth: currentMonth + 1,
            currentDate,
            currentHour,
            currentMinute,
        });

        const camhistories = await Camhistory.find({
            status: "Remainder On",
            campaignname: { $regex: /Birthday Remainder/i }
        });

        console.log(`📦 Total birthday campaigns fetched: ${camhistories.length}`);

        const matchingCampaigns = camhistories.filter(camhistory => {
            const scheduledDate = new Date(camhistory.scheduledTime);
            if (isNaN(scheduledDate.getTime())) {
                console.warn(`⚠️ Invalid scheduledTime for campaign: ${camhistory.campaignname}`, camhistory.scheduledTime);
                return false;
            }

            const scheduledDay = scheduledDate.getUTCDate();
            const scheduledMonth = scheduledDate.getUTCMonth();
            const scheduledHour = scheduledDate.getUTCHours();
            const scheduledMinute = scheduledDate.getUTCMinutes();

            console.log(`📌 Checking campaign: ${camhistory.campaignname}`);
            console.log("    ⏰ Scheduled at (UTC):", scheduledDate.toISOString());
            console.log("    🧭 Comparing to:", `${currentDate}-${currentMonth + 1} ${currentHour}:${currentMinute}`);

            const timeMatch = scheduledHour === currentHour && scheduledMinute === currentMinute;
            const dateMatch = scheduledDay === currentDate && scheduledMonth === currentMonth;
            const notSentThisYear = camhistory.lastSentYear !== currentYear;

            const isMatch = timeMatch && dateMatch && notSentThisYear;
            console.log(`    ✅ Match: ${isMatch}`);

            return isMatch;
        });

        if (matchingCampaigns.length === 0) {
            console.log("⚠️ No annual birthday campaigns to send at this time.");
            return;
        }

        console.log(`🚀 Matching campaigns to run: ${matchingCampaigns.length}`);

        await Promise.allSettled(matchingCampaigns.map(async (camhistory) => {
            console.log(`🎯 Running campaign: ${camhistory.campaignname}`);

            const groupId = camhistory.groupId?.trim();
            if (!mongoose.Types.ObjectId.isValid(groupId)) {
                console.log(`❌ Invalid groupId for campaign: ${camhistory.campaignname}`);
                return;
            }

            console.log(`📨 Fetching students for groupId: ${groupId}`);
            const studentsResponse = await axios.get(`${apiConfig.baseURL}/api/stud/groups/${groupId}/students`);
            const allStudents = studentsResponse.data;
            console.log(`👥 Total students in group: ${allStudents.length}`);

            const today = new Date();
            const todayDate = today.getDate();
            const todayMonth = today.getMonth() + 1;

            const birthdayStudents = allStudents.filter(student => {
                if (!student.Date) return false;
                const dob = new Date(student.Date);
                return dob.getDate() === todayDate && (dob.getMonth() + 1) === todayMonth;
            });

            console.log(`🎂 Students with birthdays today: ${birthdayStudents.length}`);

            if (birthdayStudents.length === 0) {
                console.log(`🎈 No birthdays today for campaign: ${camhistory.campaignname}`);
                return;
            }

            let sentEmails = [], failedEmails = [];

            console.log(`📤 Updating campaign status to "Pending"...`);
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

            const total = camhistory.totalEmails || 0;
            const progress = total > 0 ? Math.round((sentEmails.length / total) * 100) : 0;

            console.log(`📊 Finalizing campaign stats...`);
            await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`, {
                sendcount: sentEmails.length,
                failedcount: failedEmails.length,
                sentEmails,
                failedEmails,
                status: "Remainder On",
                lastSentYear: currentYear,
                progress
            });

            console.log(`🎉 Campaign "${camhistory.campaignname}" complete. Sent: ${sentEmails.length}, Failed: ${failedEmails.length}`);
        }));

    } catch (err) {
        console.error("❌ Error in annual birthday cron:", err.message);
    }
});
