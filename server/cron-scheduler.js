import Camhistory from "./models/Camhistory.js";
import mongoose from "mongoose";
import axios from "axios";
import cron from "node-cron";
import apiConfig from "../my-app/src/apiconfig/apiConfig.js";


console.log("Cron job started for sending scheduled emails.");

cron.schedule('* * * * *', async () => {
    try {
        const nowUTC = new Date();
        nowUTC.setSeconds(0, 0);
        const nextMinute = new Date(nowUTC);
        nextMinute.setMinutes(nextMinute.getMinutes() + 1);

        console.log("Checking for scheduled emails at:", new Date().toLocaleString());
        
        const camhistories = await Camhistory.find({
            status: "Scheduled On",
            scheduledTime: { $gte: nowUTC.toISOString(), $lt: nextMinute.toISOString() }
        });

        if (camhistories.length === 0) {
            console.log("No scheduled emails found.");
            return;
        }

        await Promise.all(camhistories.map(async (camhistory) => {
            console.log(`Processing scheduled email for user: ${camhistory.user}`);
            const groupId = camhistory.groupId?.trim();
            let sentEmails = [];
            let failedEmails = [];
            
            if (!groupId || groupId.toLowerCase() === "no group") {
                console.log("No group found, sending emails directly.");
                await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`, { status: "Pending" });
                
                let recipients = camhistory.recipients.split(",").map(email => email.trim());
                
                await Promise.all(recipients.map(async (email) => {
                    const personalizedContent = camhistory.previewContent.map(item =>
                        item.content ? { ...item, content: item.content.replace(/\{?Email\}?/g, email) } : item
                    );
                    
                    const emailData = {
                        recipientEmail: email,
                        subject: camhistory.subject,
                        aliasName: camhistory.aliasName,
                        body: JSON.stringify(personalizedContent),
                        bgColor: camhistory.bgColor,
                        previewtext: camhistory.previewtext,
                        attachments: camhistory.attachments,
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
                    const totalEmails = sentEmails.length + failedEmails.length;
                    const successProgress = Math.round((sentEmails.length / totalEmails) * 100);
                    const failProgress = Math.round((failedEmails.length / totalEmails) * 100);
                    const currentProgress = failedEmails.length > 0 ? failProgress : successProgress;
                    
                    await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`, {
                        sendcount: sentEmails.length,
                        failedcount: failedEmails.length,
                        sentEmails,
                        failedEmails,
                        status:"In progress",
                        progress: currentProgress,
                    });
                    console.log(`Progress updated: ${currentProgress}%`);
                    
                }));
            } 
            else if (groupId.toLowerCase() === "no id") {
                console.log("No valid ID found, resending only to failed emails.");
                await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`, { status: "Pending" });
                
                await Promise.all(camhistory.exceldata.map(async (student) => {
                    const personalizedContent = camhistory.previewContent.map(item => {
                        if (!item.content) return item;
                        let updatedContent = item.content;
                        const studentData = student._doc || student;
                        Object.entries(studentData).forEach(([key, value]) => {
                            const placeholderRegex = new RegExp(`\{${key.trim()}\}`, "gi");
                            updatedContent = updatedContent.replace(placeholderRegex, value != null ? String(value).trim() : "");
                        });
                        return { ...item, content: updatedContent };
                    });
                    
                    const emailData = {
                        recipientEmail: student.Email,
                        subject: camhistory.subject,
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
                    } catch (error) {
                        console.error(`Failed to send email to ${student.Email}:`, error);
                        failedEmails.push(student.Email);
                    }
                    const totalEmails = sentEmails.length + failedEmails.length;
                    const successProgress = Math.round((sentEmails.length / totalEmails) * 100);
                    const failProgress = Math.round((failedEmails.length / totalEmails) * 100);
                    const currentProgress = failedEmails.length > 0 ? failProgress : successProgress;
                    
                    await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`, {
                        sendcount: sentEmails.length,
                        failedcount: failedEmails.length,
                        sentEmails,
                        failedEmails,
                        status:"In progress",
                        progress: currentProgress,
                    });
                    console.log(`Progress updated: ${currentProgress}%`);

                }));
            } 
            else if (mongoose.Types.ObjectId.isValid(groupId)) {
                console.log("Valid group ID found, sending emails through group.");
                const studentsResponse = await axios.get(`${apiConfig.baseURL}/api/stud/groups/${groupId}/students`);
                const students = studentsResponse.data;
                await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`, { status: "Pending" });
                
                await Promise.all(students.map(async (student) => {
                    const personalizedContent = camhistory.previewContent.map(item => {
                        if (!item.content) return item;
                        let updatedContent = item.content;
                        Object.entries(student).forEach(([key, value]) => {
                            const placeholderRegex = new RegExp(`\{?${key}\}?`, "g");
                            updatedContent = updatedContent.replace(placeholderRegex, value != null ? String(value).trim() : "");
                        });
                        return { ...item, content: updatedContent };
                    });
                    
                    const emailData = {
                        recipientEmail: student.Email,
                        subject: camhistory.subject,
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
                    } catch (error) {
                        console.error(`Failed to send email to ${student.Email}:`, error);
                        failedEmails.push(student.Email);
                    }
                    const totalEmails = sentEmails.length + failedEmails.length;
                    const successProgress = Math.round((sentEmails.length / totalEmails) * 100);
                    const failProgress = Math.round((failedEmails.length / totalEmails) * 100);
                    const currentProgress = failedEmails.length > 0 ? failProgress : successProgress;
                    
                    await axios.put(`${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`, {
                        sendcount: sentEmails.length,
                        failedcount: failedEmails.length,
                        sentEmails,
                        failedEmails,
                        status:"In progress",
                        progress: currentProgress,
                    });
                    console.log(`Progress updated: ${currentProgress}%`);

                }));
            }    
             // Update campaign history with final status
      const finalStatus = failedEmails.length > 0 ? "Failed" : "Success";
      await axios.put(
        `${apiConfig.baseURL}/api/stud/camhistory/${camhistory._id}`,
        {
          sendcount: sentEmails.length,
          sentEmails: sentEmails,
          failedEmails: failedEmails.length > 0 ? failedEmails : 0,
          failedcount: failedEmails.length > 0 ? failedEmails.length : 0, // Ensure failedcount is 0, not an empty array
          status: finalStatus,
        }
      );
            console.log(`Emails sent successfully for user: ${camhistory.user}`);
        }));
    } catch (error) {
        console.error("Error in cron job:", error);
    }
});
