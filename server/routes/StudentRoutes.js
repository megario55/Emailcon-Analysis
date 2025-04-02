import express from "express";
import nodemailer from "nodemailer";
import { upload } from "../config/cloudinary.js";
import Student from "../models/Student.js";
import Group from "../models/Group.js";
import Campaign from "../models/Campaign.js";
import Template from "../models/Template.js";
import User from "../models/User.js"; // Ensure you import the User model
import Camhistory from "../models/Camhistory.js";
// import ExcelStudent from "../models/Excelstudent.js";
import { decryptPassword } from "../config/encryption.js";
import EmailOpen from "../models/EmailOpen.js";
import ClickTracking from "../models/ClickTracking.js";

const router = express.Router();

// Upload image to Cloudinary
router.post('/upload', upload.single('image'), (req, res) => {
  if (req.file && req.file.path) {
    res.json({
      imageUrl: req.file.path
    });
  } else {
    res.status(400).send('Image upload failed');
  }
});

router.post("/uploadfile", upload.array("attachments", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      console.error("No files received");
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Extract URLs directly from req.files
    const fileUrls = req.files.map(file => file.path); // Cloudinary returns the URL in 'path'

    res.json({ fileUrls });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "File upload failed", details: error.message });
  }
});



// Route to send a test email
router.post('/sendtestmail', async (req, res) => {
  try {
    const {
      emailData,
      attachments,
      previewContent,
      bgColor,
      campaignId,
      userId
    } = req.body;

    // Find the current user by userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    // user model has fields for email and smtppassword
    const {
      email,
      smtppassword
    } = user;
    // Determine the transporter based on email provider
    let transporter;

    if (email.includes("gmail")) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: email,
          pass: decryptPassword(smtppassword),
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true, // Use SSL/TLS
        auth: {
          user: email,
          pass: decryptPassword(smtppassword),
        },
        tls: {
          // Do not fail on invalid certificates
          rejectUnauthorized: false,
        },
      });
    };

    const generateTrackingLink = (originalUrl, userId, campaignId, recipientEmail) => {
      return `https://emailcon-campaign-backend-u45r.onrender.com/api/stud/track-click?emailId=${encodeURIComponent(recipientEmail)}&url=${encodeURIComponent(originalUrl)}&userId=${userId}&campaignId=${campaignId}`;
    };


    const emailContent = previewContent.map((item) => {
      if (item.type === 'para') {
        return `<div class="para" style="border-radius:10px;font-size:${item.style.fontSize};padding:10px; color:${item.style.color}; margin-top:20px; background-color:${item.style.backgroundColor}">${item.content}</div>`;
      } else if (item.type === 'head') {
        return `<p class="head" style="font-size:${item.style.fontSize};border-radius:10px;padding:10px;font-weight:bold;color:${item.style.color};text-align:${item.style.textAlign};background-color:${item.style.backgroundColor}">${item.content}</p>`;
      } else if (item.type === 'logo') {
        return `<div style="text-align:${item.style.textAlign};margin:0 auto !important">
        <img src="${item.src}" style="width:${item.style.width};height:${item.style.height};border-radius:${item.style.borderRadius};pointer-events:none;margin:${item.style.margin};background-color:${item.style.backgroundColor};"/>
        </div>`
      } else if (item.type === 'image') {
        return `<div style="text-align:${item.style.textAlign};margin:0 auto !important">
        <img src="${item.src}" style="margin-top:10px;width:${item.style.width};pointer-events:none;height:${item.style.height};border-radius:10px;background-color:${item.style.backgroundColor}"/>
        </div>`;
      }
      else if (item.type === 'cardimage') {
        return `
        <table role="presentation" align="center" width="${item.style.width}" style="border-collapse: separate; border-spacing: 0; margin: 10px auto!important;">
    <tr>
        <td align="center" width="${item.style.width}" style="vertical-align: top; border-radius: 10px; padding: 0;">
            <!-- Image -->
            <img src="${item.src1}" width="${item.style.width}" style="display: block; width: 100%; height: auto; max-width: ${item.style.width}; border-top-left-radius: 10px; border-top-right-radius: 10px; object-fit: cover;" alt="image"/>
            
            <!-- Text Content -->
            <div style="font-size: 15px; background-color: ${item.style1.backgroundColor || '#f4f4f4'};width: ${item.style.width}; color: ${item.style1.color || 'black'}; padding:10px 0px; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
                ${item.content1}
            </div>
        </td>
    </tr>
</table>`
      }

      else if (item.type === 'multi-image') {
        return `<table class="multi" style="width:100%; border-collapse:collapse;margin:10px auto !important;">
        <tr>
            <td style="width:50%;text-align:center;padding:8px; vertical-align:top;">
                <img src="${item.src1}" style="border-radius:10px;object-fit:contain;height:230px !important;width:100%;pointer-events:none !important; object-fit:cover;" alt="image"/>
                    <a class = "img-btn"
                    href="${generateTrackingLink(item.link1, userId, campaignId, emailData.recipient)}"
                    target = "_blank"
                    style = "display:inline-block;padding:12px 25px;width:${item.buttonStyle1.width || 'auto'};color:${item.buttonStyle1.color || '#000'};text-decoration:none;background-color:${item.buttonStyle1.backgroundColor || '#f0f0f0'};text-align:${item.buttonStyle1.textAlign || 'left'};border-radius:${item.buttonStyle1.borderRadius || '5px'};" >
                        ${item.content1}
                    </a>
            </td>
            <td style="width:50%;text-align:center;padding:8px; vertical-align:top;">
                <img src="${item.src2}" style="border-radius:10px;object-fit:contain;height:230px !important;width:100%;pointer-events:none !important; object-fit:cover;" alt="image"/>
                    <a class = "img-btn"
                    href="${generateTrackingLink(item.link2, userId, campaignId, emailData.recipient)}"
                    target = "_blank"
                    style = "display:inline-block;padding:12px 25px;width:${item.buttonStyle2.width || 'auto'};color:${item.buttonStyle2.color || '#000'};text-decoration:none;background-color:${item.buttonStyle2.backgroundColor || '#f0f0f0'};text-align:${item.buttonStyle2.textAlign || 'left'};border-radius:${item.buttonStyle2.borderRadius || '5px'};" >
                        ${item.content2}
                    </a>
            </td>
        </tr>
    </table>`

      }

      else if (item.type === 'multipleimage') {
        return `<table class="multi" style="width:100%; border-collapse:collapse;margin:10px auto !important;">
        <tr>
            <td style="width:50%;text-align:center;padding:8px; vertical-align:top;">
                <img src="${item.src1}" style="border-radius:10px;object-fit:contain;height:230px !important;width:100%;pointer-events:none !important; object-fit:cover;" alt="image"/>
            </td>
            <td style="width:50%;text-align:center;padding:8px; vertical-align:top;">
                <img src="${item.src2}" style="border-radius:10px;object-fit:contain;height:230px !important;width:100%;pointer-events:none !important; object-fit:cover;" alt="image"/>
            </td>
        </tr>
    </table>`
      }


      else if (item.type === 'icons') {
        return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${item.ContentStyle.backgroundColor || 'white'}; border-radius:${item.ContentStyle.borderRadius || '10px'}; margin:15px 0px !important;">
            <tr>
                <td align="${item.ContentStyle.textAlign}" style="padding: 20px; text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                        <tr>
                            <td style="padding: 0 10px;">
                                <a href="${generateTrackingLink(item.links1, userId, campaignId, emailData.recipient)}" target="_blank" style="text-decoration:none;">
                                    <img src="${item.iconsrc1}" style="cursor:pointer;width:${item.style1.width};height:${item.style1.height};" alt="icon1"/>
                                </a>
                            </td>
                            <td style="padding: 0 10px;">
                                <a href="${generateTrackingLink(item.links2, userId, campaignId, emailData.recipient)}" target="_blank" style="text-decoration:none;">
                                    <img src="${item.iconsrc2}" style="cursor:pointer;width:${item.style2.width};height:${item.style2.height};" alt="icon2"/>
                                </a>
                            </td>
                            <td style="padding: 0 12px;">
                                <a href="${generateTrackingLink(item.links3, userId, campaignId, emailData.recipient)}" target="_blank" style="text-decoration:none;">
                                    <img src="${item.iconsrc3}" style="cursor:pointer;width:${item.style3.width};height:${item.style3.height};" alt="icon3"/>
                                </a>
                            </td>
                            <td style="padding: 0 10px;">
                                <a href="${generateTrackingLink(item.links4, userId, campaignId, emailData.recipient)}" target="_blank" style="text-decoration:none;">
                                    <img src="${item.iconsrc4}" style="cursor:pointer;width:${item.style4.width};height:${item.style4.height};" alt="icon4"/>
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>`;
      }

      else if (item.type === 'video-icon') {
        return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
      <tr>
        <td align="center">
          <table role="presentation" width="${item.style.width}" height="${item.style.height}" cellspacing="0" cellpadding="0" border="0"
                 style="background: url('${item.src1}') no-repeat center center; background-size: cover; border-radius: 10px; overflow: hidden; margin: 15px 0px !important;">
            <tr>
              <td align="center" valign="middle" style="height: ${item.style.height}; padding: 0;">
                <a href="${generateTrackingLink(item.link, userId, campaignId, emailData.recipient)}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
  <img src="${item.src2}" width="70" height="70" 
       style="display: block; border-radius: 50%; background-color: white; cursor: pointer;" 
       alt="Play Video" border="0"/>
</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
      }

      else if (item.type === 'imagewithtext') {
        return `<table class="image-text" style="width:100%;height:220px !important;background-color:${item.style1.backgroundColor || '#f4f4f4'}; border-collapse:seperate;border-radius:${item.style1.borderRadius || '10px'};margin:15px 0px !important">
        <tr>
            <td style = "vertical-align:top;padding:10px;" >
                <img src="${item.src1}" style="border-radius:10px;width:200px !important;height:auto;pointer-events:none !important; object-fit:cover;" alt="image"/>                  
            </td>
            <td style = "vertical-align:top;padding:10px;color:${item.style1.color || 'black'};" >
                <div class="img-para" style="overflow: auto;max-height: 200px !important;font-size:18px;">
                ${item.content1}
                </div>
            </td>
        </tr>
    </table>`;
      }

      else if (item.type === 'textwithimage') {
        return `<table class="image-text" style="width:100%;height:220px !important;background-color:${item.style.backgroundColor || '#f4f4f4'}; border-collapse:seperate;border-radius:${item.style.borderRadius || '10px'};margin:15px 0px !important">
        <tr>
          <td style = "vertical-align:top;padding:10px;color:${item.style.color || 'black'};" >
                <div class="img-para" style="overflow: auto;max-height: 200px !important;font-size:18px;">
                ${item.content2}
                </div> 
            </td>
            <td style = "vertical-align:top;padding:10px;" >
                <img src="${item.src2}" style="border-radius:10px;width:200px !important;height:auto;pointer-events:none !important; object-fit:cover;" alt="image"/>                  
            </td>         
        </tr>
    </table>`
      }
      else if (item.type === 'link-image') {
        return `<div style="text-align:${item.style.textAlign};margin:0 auto !important">
        <a href="${generateTrackingLink(item.link, userId, campaignId, emailData.recipient)}" taget="_blank" style="text-decoration:none;"><img src="${item.src}" style="margin-top:10px;width:${item.style.width};text-align:${item.style.textAlign};pointer-events:none;height:${item.style.height};border-radius:10px;background-color:${item.style.backgroundColor}"/></a>
        </div>`;
      } else if (item.type === 'button') {
        return `<div style="text-align:${item.style.textAlign || 'left'};padding-top:20px;">
                  <a href="${generateTrackingLink(item.link, userId, campaignId, emailData.recipient)}" target="_blank" style="display:inline-block;padding:12px 25px;width:${item.style.width || 'auto'};color:${item.style.color || '#000'};text-decoration:none;background-color:${item.style.backgroundColor || '#f0f0f0'};text-align:${item.style.textAlign || 'left'};border-radius:${item.style.borderRadius || '0px'};">
                    ${item.content || 'Button'}
                  </a>
                </div>`;
      }
    }).join('');

    const Attachments = attachments.map(file => ({
      filename: file.originalName,
      path: file.fileUrl, // Use Cloudinary URL directly
      contentType: file.mimetype
    }));


    const trackingPixel = `<img src="https://emailcon-campaign-backend-u45r.onrender.com/api/stud/track-email-open?emailId=${encodeURIComponent(emailData.recipient)}&userId=${userId}&campaignId=${campaignId}&t=${Date.now()}" width="1" height="1" style="display:none;" />`;

    const mailOptions = {
      from: `"${emailData.aliasName}" <${email}>`,
      to: emailData.recipient,
      subject: emailData.subject,
      attachments: Attachments,

      html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
               
              @media(max-width:768px) {
                .main { width: 330px !important; }
                .img-case { width: 330px !important; }

                .para{
                  font-size:15px !important;
                }
 
                .img-para{
                  font-size:15px !important;
                }
                .image-text{
                  width:330px !important;}
                            
              .image-text tr{
    display: flex !important;
    flex-wrap: nowrap !important;
    justify-content: space-between !important;
  }
                
  /* Keep images inline on small screens */
  .multi tr {
    display: flex !important;
    flex-wrap: nowrap !important;
    justify-content: space-between !important;
  }
  .multi tr td {
    width: 48% !important; /* Ensures images stay side by side */
    padding: 5px !important;
  }
  .multi tr td img {
    height: 150px !important; /* Adjust image height for better fit */
    width: 100% !important;
    object-fit: cover !important;
  } 

                // .multimain td{
                //   padding:5px 8px 0px 0px !important;
                // }
                // .multi-img{
                //   width:100% !important;
                //   max-width:170px !important;
                //   height:auto !important;
                //   object-fit: contain !important; 

                // }
                 .img-btn{
                  width:85% !important;
                  margin:10px auto !important;
                  font-size:10px !important;
                  padding:10px !important;
                  
                }
                .head{
                  font-size:20px !important;
                }
              }
            </style>
          </head>

          <body>
              <div style="display:none !important; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
                ${emailData.previewtext}  
              </div>
            <div class="main" style ="background-color:${bgColor || "white"};box-shadow:0 4px 8px rgba(0, 0, 0, 0.2);border:1px solid rgb(255, 245, 245);padding:20px;width:650px;height:auto;border-radius:10px;margin:0 auto;" >
              ${emailContent}
              ${trackingPixel}
            </div>
          
          </body>
      
        </html>
      `,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        return res.status(500).send(error.toString());
      }
      console.log(`Email sent to: ${emailData.recipient}`);
      res.send('Email Sent');
    });
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

//sendexcelmail directly
router.post('/sendexcelEmail', async (req, res) => {
  const {
    recipientEmail,
    subject,
    aliasName,
    body,
    bgColor, attachments,
    previewtext,
    userId,
    campaignId
  } = req.body;
  console.log("Attachments Data:", attachments);

  if (!recipientEmail) {
    return res.status(400).send("Email is required.");
  }
  // Find the current user by userId
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).send('User not found');
  }

  // user model has fields for email and smtppassword
  const {
    email,
    smtppassword
  } = user;

  // Determine the transporter based on email provider
  let transporter;

  if (email.includes("gmail")) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: email,
        pass: decryptPassword(smtppassword),
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true, // Use SSL/TLS
      auth: {
        user: email,
        pass: decryptPassword(smtppassword),
      },
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false,
      },
    });
  }


  try {
    // Parse the body string as JSON
    const bodyElements = JSON.parse(body);

    // Function to generate HTML from JSON structure
    const generateHtml = (element) => {
      const {
        type,
        content,
        content1,
        content2,
        src1,
        src2,
        src,
        style,
        style1, style2, style3, style4,
        link, links1, links2, links3, links4,
        ContentStyle,
        iconsrc1, iconsrc2, iconsrc3, iconsrc4,
        link2,
        link1,
        buttonStyle1,
        buttonStyle2,
      } = element;
      const ContentStyleString = Object.entries(ContentStyle || {}).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`).join(';');
      const styleString4 = Object.entries(style4 || {}).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`).join(';');
      const styleString3 = Object.entries(style3 || {}).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`).join(';');
      const styleString2 = Object.entries(style2 || {}).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`).join(';');
      const styleString1 = Object.entries(style1 || {}).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`).join(';');
      const styleString = Object.entries(style || {}).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`).join(';');
      const stylebuttonString1 = Object.entries(buttonStyle1 || {}).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`).join(';');
      const stylebuttonString2 = Object.entries(buttonStyle2 || {}).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`).join(';');
      const styleStringvideo = Object.entries(style || {})
        .filter(([key]) => key === 'width' || key === 'height')
        .map(([key, value]) => `${key}:${value}`)
        .join(';');
      const generateTrackingLink = (originalUrl, userId, campaignId, recipientEmail) => {
        return `https://emailcon-campaign-backend-u45r.onrender.com/api/stud/track-click?emailId=${encodeURIComponent(recipientEmail)}&url=${encodeURIComponent(originalUrl)}&userId=${userId}&campaignId=${campaignId}`;
      };
      switch (type) {
        case 'logo':
          return `<div style="margin:0 auto !important;${styleString};">
                  <img src="${src}" style="margin-top:10px;${styleString};" alt="image"/>
                </div>`;

        case 'image':
          return `<div class="img-case" style="margin:0 auto !important;${styleString};">
       <img src="${src}" style="${styleString};border-radius:10px;margin-top:10px;" alt="image" />
       </div>`;

        case 'imagewithtext':
          return `<table class="image-text" style="width:100%;height:220px !important;border-collapse:seperate;border-radius:10px;margin:15px 0px !important;${styleString1};">
      <tr>
          <td style = "vertical-align:top;padding:10px;">
              <img  src="${src1}" style="border-radius:10px;width:200px !important;height:auto;pointer-events:none !important; object-fit:cover;" alt="image"/>                  
          </td>
          <td style = "vertical-align:top;padding:10px;${styleString1};">
              <div class="img-para" style="overflow: auto;max-height: 200px !important;font-size:18px;">
              ${content1}
              </div>
          </td>
      </tr>
  </table>`;

        case 'cardimage':
          return `
    <table role="presentation" align="center"  style="${styleString};border-collapse: separate; border-spacing: 0; margin: 10px auto!important;">
<tr>
    <td align="center"  style="vertical-align: top;${styleString} border-radius: 10px; padding: 0;">
        <!-- Image -->
        <img src="${src1}" style="display: block;${styleString}; border-top-left-radius: 10px; border-top-right-radius: 10px; object-fit: cover;" alt="image"/>
        
        <!-- Text Content -->
        <div style="font-size: 15px;${styleString};${styleString1}; padding:10px 0px; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
            ${content1}
        </div>
    </td>
</tr>
</table>`

        case 'textwithimage':
          return `<table class="image-text" style="width:100%;height:220px !important;border-collapse:seperate;border-radius:10px;margin:15px 0px !important;${styleString};">
      <tr>
        <td style = "vertical-align:top;padding:10px;${styleString};">
              <div class="img-para" style="overflow: auto;max-height: 200px !important;font-size:18px;">
              ${content2}
              </div>
          </td>
          <td style = "vertical-align:top;padding:10px;">
              <img  src="${src2}" style="border-radius:10px;width:200px !important;height:auto;pointer-events:none !important; object-fit:cover;" alt="image"/>                  
          </td>
        
      </tr>
  </table>`;

        case 'video-icon':
          return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
<tr>
  <td align="center">
    <table role="presentation"  cellspacing="0" cellpadding="0" border="0" 
           style="${styleStringvideo};background: url('${src1}') no-repeat center center; background-size: cover; border-radius: 10px; overflow: hidden;margin:15px 0px !important;">
      <tr>
        <td align="center" valign="middle" style="${styleStringvideo};padding: 0;">
          <a href="${generateTrackingLink(link, userId, campaignId, recipientEmail)}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
            <img src="${src2}" width="70" height="70" 
                 style="display: block; border-radius: 50%; background-color: white;" 
                 alt="Click Now" />
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>
</table>
  `;


        case 'icons':
          return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="${ContentStyleString};margin:15px 0px !important;">
        <tr>
            <td style="padding: 20px; text-align:center;${ContentStyleString};">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                    <tr>
                        <td style="padding: 0 10px;">
                            <a href="${generateTrackingLink(links1, userId, campaignId, recipientEmail)}" target="_blank" style="text-decoration:none;">
                                <img src="${iconsrc1}" style="cursor:pointer;${styleString1};" alt="icon1"/>
                            </a>
                        </td>
                        <td style="padding: 0 10px;">
                            <a href="${generateTrackingLink(links2, userId, campaignId, recipientEmail)}" target="_blank" style="text-decoration:none;">
                                <img src="${iconsrc2}" style="cursor:pointer;${styleString2};" alt="icon2"/>
                            </a>
                        </td>
                        <td style="padding: 0 12px;">
                        <a href="${generateTrackingLink(links3, userId, campaignId, recipientEmail)}" target="_blank" style="text-decoration:none;">
                            <img src="${iconsrc3}" style="cursor:pointer;${styleString3};" alt="icon3"/>
                        </a>
                    </td>
                     <td style="padding: 0 10px;">
                        <a href="${generateTrackingLink(links4, userId, campaignId, recipientEmail)}" target="_blank" style="text-decoration:none;">
                            <img src="${iconsrc4}" style="cursor:pointer;${styleString4};" alt="icon3"/>
                        </a>
                    </td>                     
                  </tr>
                </table>
            </td>
        </tr>
    </table>`;

        case 'link-image':
          return `<div class="img-case" style="margin:0 auto !important;${styleString};">
        <a href = "${generateTrackingLink(link, userId, campaignId, recipientEmail)}"  target = "_blank" style="text-decoration:none;"><img src="${src}" style="${styleString};margin-top:10px;border-radius:10px;" alt="image"/></a>
        </div>`;

        case 'multi-image':
          return `<table class="multi" style="width:100%; border-collapse:collapse;margin:10px auto !important;">
          <tr>
              <td style="width:50%;text-align:center;padding:8px; vertical-align:top;">
                  <img src="${src1}" style="border-radius:10px;object-fit:contain;height:230px !important;width:100%;pointer-events:none !important; object-fit:cover; ${styleString}" alt="image"/>
                  <a class="img-btn" href="${generateTrackingLink(link1, userId, campaignId, recipientEmail)}" target="_blank" style="${stylebuttonString1}; display:inline-block; padding:12px 25px; text-decoration:none;">
                      ${content1}
                  </a>
              </td>
              <td style="width:50%;text-align:center;padding:8px; vertical-align:top;">
                  <img src="${src2}" style="border-radius:10px;object-fit:contain;height:230px !important;width:100%;pointer-events:none !important; object-fit:cover;${styleString}" alt="image"/>
                  <a class="img-btn" href="${generateTrackingLink(link2, userId, campaignId, recipientEmail)}" target="_blank" style="${stylebuttonString2}; display:inline-block; padding:12px 25px; text-decoration:none;">
                      ${content2}
                  </a>
              </td>
          </tr>
        </table>`;
        case 'multipleimage':
          return `<table class="multi" style="width:100%; border-collapse:collapse;margin:10px auto !important;">
          <tr>
              <td style="width:50%;text-align:center;padding:8px; vertical-align:top;">
                  <img src="${src1}" style="border-radius:10px;object-fit:contain;height:230px !important;width:100%;pointer-events:none !important; object-fit:cover;" alt="image"/>
              </td>
              <td style="width:50%;text-align:center;padding:8px; vertical-align:top;">
                  <img src="${src2}" style="border-radius:10px;object-fit:contain;height:230px !important;width:100%;pointer-events:none !important; object-fit:cover;" alt="image"/>
              </td>
          </tr>
      </table>`

        case 'head':
          return `<p class="head" style="${styleString};border-radius:10px;padding:10px;font-weight:bold;">${content}</p>`;
        case 'para':
          return `<div class="para" style="${styleString};border-radius:10px;padding:10px;">${content}</div>`;
        case 'button':
          return `<div style="margin:20px auto 0 auto;text-align:center;">
                  <a href = "${generateTrackingLink(link, userId, campaignId, recipientEmail)}"
                  target = "_blank"
                  style = "${styleString};display:inline-block;padding:12px 25px;text-decoration:none;" >
                    ${content}
                  </a>
                </div>`;
        default:
          return '';
      }
    };

    const dynamicHtml = bodyElements.map(generateHtml).join('');
    const Attachments = attachments.map(file => ({
      filename: file.originalName,
      path: file.fileUrl, // Use Cloudinary URL directly
      contentType: file.mimetype
    }));

    const trackingPixel = `<img src="https://emailcon-campaign-backend-u45r.onrender.com/api/stud/track-email-open?emailId=${encodeURIComponent(recipientEmail)}&userId=${userId}&campaignId=${campaignId}&t=${Date.now()}" width="1" height="1" style="display:none;" />`;

    const mailOptions = {
      from: `"${aliasName}" <${email}>`,
      to: recipientEmail,
      subject: subject,
      attachments: Attachments,
      html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
              
             .img-case {
  margin:0 auto !important;
  text-align:center !important;
  display:block;
  width:100%;
  max-width: 650px; /* Adjust as needed */
}

.img-case img {
  display: block;
  margin: 0 auto; /* Ensures the image is centered */
  max-width: 100%;
  height: auto; /* Ensures the image maintains its aspect ratio */
}
           

              @media(max-width:768px) {
                .main { width: 330px !important; }
                .img-case { width: 330px !important; }

                .para{
                  font-size:15px !important;
                }
                .img-para{
                  font-size:12px !important;
                }
                  .image-text tr{
    display: flex !important;
    flex-wrap: nowrap !important;
    justify-content: space-between !important;
  }
                
  /* Keep images inline on small screens */
  .multi tr {
    display: flex !important;
    flex-wrap: nowrap !important;
    justify-content: space-between !important;
  }
  .multi tr td {
    width: 48% !important; /* Ensures images stay side by side */
    padding: 5px !important;
  }
  .multi tr td img {
    height: 150px !important; /* Adjust image height for better fit */
    width: 100% !important;
    object-fit: cover !important;
  } 

                // .multimain td{
                //   padding:5px 8px 0px 0px !important;
                // }
                // .multi-img{
                //   width:100% !important;
                //   max-width:170px !important;
                //   height:auto !important;
                //   object-fit: contain !important; 

                // }
                 .img-btn{
                  width:85% !important;
                  margin:10px auto !important;
                  font-size:10px !important;
                  padding:10px !important;
                  
                }
                .head{
                  font-size:20px !important;
                }
              }
            </style>
          </head>
          <body>
            <div style="display:none !important; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
              ${previewtext}
            </div>
              <div class="main" style="background-color:${bgColor || "white"}; box-shadow:0 4px 8px rgba(0, 0, 0, 0.2); border:1px solid rgb(255, 245, 245); padding:20px;width:650px;height:auto;border-radius:10px;margin:0 auto;">
                ${dynamicHtml}
                ${trackingPixel}
              </div>
          </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to: ${recipientEmail}`);
    res.send('All Email sent successfully!');
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send(error.toString());
  }
});


//Sendbulk mail using group
router.post('/sendbulkEmail', async (req, res) => {
  const {
    recipientEmail,
    subject,
    aliasName,
    body,
    bgColor, attachments,
    previewtext,
    userId,
    campaignId
  } = req.body;

  if (!recipientEmail) {
    return res.status(400).send("Email is required.");
  }
  // Find the current user by userId
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).send('User not found');
  }

  // user model has fields for email and smtppassword
  const {
    email,
    smtppassword
  } = user;

  // Determine the transporter based on email provider
  let transporter;

  if (email.includes("gmail")) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: email,
        pass: decryptPassword(smtppassword),
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true, // Use SSL/TLS
      auth: {
        user: email,
        pass: decryptPassword(smtppassword),
      },
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false,
      },
    });
  }


  try {
    // Parse the body string as JSON
    const bodyElements = JSON.parse(body);

    // Function to generate HTML from JSON structure
    const generateHtml = (element) => {
      const {
        type,
        content,
        content1,
        content2,
        src1,
        src2,
        src,
        style,
        style1, style2, style3, style4,
        link, links1, links2, links3, links4,
        ContentStyle,
        iconsrc1, iconsrc2, iconsrc3, iconsrc4,
        link2,
        link1,
        buttonStyle1,
        buttonStyle2,
      } = element;
      const ContentStyleString = Object.entries(ContentStyle || {}).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`).join(';');
      const styleString4 = Object.entries(style4 || {}).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`).join(';');
      const styleString3 = Object.entries(style3 || {}).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`).join(';');
      const styleString2 = Object.entries(style2 || {}).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`).join(';');
      const styleString1 = Object.entries(style1 || {}).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`).join(';');
      const styleString = Object.entries(style || {}).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`).join(';');
      const stylebuttonString1 = Object.entries(buttonStyle1 || {}).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`).join(';');
      const stylebuttonString2 = Object.entries(buttonStyle2 || {}).map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`).join(';');
      const styleStringvideo = Object.entries(style || {})
        .filter(([key]) => key === 'width' || key === 'height')
        .map(([key, value]) => `${key}:${value}`)
        .join(';');

      const generateTrackingLink = (originalUrl, userId, campaignId, recipientEmail) => {
        return `https://emailcon-campaign-backend-u45r.onrender.com/api/stud/track-click?emailId=${encodeURIComponent(recipientEmail)}&url=${encodeURIComponent(originalUrl)}&userId=${userId}&campaignId=${campaignId}`;
      };

      switch (type) {
        case 'logo':
          return `<div style="margin:0 auto !important;${styleString};">
                  <img src="${src}" style="margin-top:10px;${styleString};" alt="image"/>
                </div>`;

        case 'image':
          return `<div class="img-case" style="margin:0 auto !important;${styleString};">
       <img src="${src}" style="${styleString};border-radius:10px;margin-top:10px;" alt="image" />
       </div>`;

        case 'imagewithtext':
          return `<table class="image-text" style="width:100%;height:220px !important;border-collapse:seperate;border-radius:10px;margin:15px 0px !important;${styleString1};">
      <tr>
          <td style = "vertical-align:top;padding:10px;">
              <img  src="${src1}" style="border-radius:10px;width:200px !important;height:auto;pointer-events:none !important; object-fit:cover;" alt="image"/>                  
          </td>
          <td style = "vertical-align:top;padding:10px;${styleString1};">
              <div class="img-para" style="overflow: auto;max-height: 200px !important;font-size:18px;">
              ${content1}
              </div>
          </td>
      </tr>
  </table>`;


        case 'cardimage':
          return `
    <table role="presentation" align="center"  style="${styleString};border-collapse: separate; border-spacing: 0; margin: 10px auto!important;">
<tr>
    <td align="center"  style="vertical-align: top;${styleString} border-radius: 10px; padding: 0;">
        <!-- Image -->
        <img src="${src1}" style="display: block;${styleString}; border-top-left-radius: 10px; border-top-right-radius: 10px; object-fit: cover;" alt="image"/>
        
        <!-- Text Content -->
        <div style="font-size: 15px;${styleString};${styleString1}; padding:10px 0px; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
            ${content1}
        </div>
    </td>
</tr>
</table>`


        case 'textwithimage':
          return `<table class="image-text" style="width:100%;height:220px !important;border-collapse:seperate;border-radius:10px;margin:15px 0px !important;${styleString};">
      <tr>
        <td style = "vertical-align:top;padding:10px;${styleString};">
              <div class="img-para" style="overflow: auto;max-height: 200px !important;font-size:18px;">
              ${content2}
              </div>
          </td>
          <td style = "vertical-align:top;padding:10px;">
              <img  src="${src2}" style="border-radius:10px;width:200px !important;height:auto;pointer-events:none !important; object-fit:cover;" alt="image"/>                  
          </td>
        
      </tr>
  </table>`;

        case 'video-icon':
          return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
<tr>
  <td align="center">
    <table role="presentation"  cellspacing="0" cellpadding="0" border="0" 
           style="${styleStringvideo};background: url('${src1}') no-repeat center center; background-size: cover; border-radius: 10px; overflow: hidden;margin:15px 0px !important;">
      <tr>
        <td align="center" valign="middle" style="${styleStringvideo};padding: 0;">
            <a href="${generateTrackingLink(link, userId, campaignId, recipientEmail)}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
            <img src="${src2}" width="70" height="70" 
                 style="display: block; border-radius: 50%; background-color: white;" 
                 alt="Click Now" />
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>
</table>
  `;


        case 'icons':
          return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="${ContentStyleString};margin:15px 0px !important;">
        <tr>
            <td style="padding: 20px; text-align:center;${ContentStyleString};">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                    <tr>
                        <td style="padding: 0 10px;">
                            <a href="${generateTrackingLink(links1, userId, campaignId, recipientEmail)}" target="_blank" style="text-decoration:none;">
                                <img src="${iconsrc1}" style="cursor:pointer;${styleString1};" alt="icon1"/>
                            </a>
                        </td>
                        <td style="padding: 0 10px;">
                            <a href="${generateTrackingLink(links2, userId, campaignId, recipientEmail)}" target="_blank" style="text-decoration:none;">
                                <img src="${iconsrc2}" style="cursor:pointer;${styleString2};" alt="icon2"/>
                            </a>
                        </td>
                        <td style="padding: 0 12px;">
                        <a href="${generateTrackingLink(links3, userId, campaignId, recipientEmail)}" target="_blank" style="text-decoration:none;">
                            <img src="${iconsrc3}" style="cursor:pointer;${styleString3};" alt="icon3"/>
                        </a>
                    </td>
                     <td style="padding: 0 10px;">
                        <a href="${generateTrackingLink(links4, userId, campaignId, recipientEmail)}"  target="_blank" style="text-decoration:none;">
                            <img src="${iconsrc4}" style="cursor:pointer;${styleString4};" alt="icon3"/>
                        </a>
                    </td>                     
                  </tr>
                </table>
            </td>
        </tr>
    </table>`;

        case 'link-image':
          return `<div class="img-case" style="margin:0 auto !important;${styleString};">
        <a href ="${generateTrackingLink(link, userId, campaignId, recipientEmail)}" target = "_blank" style="text-decoration:none;"><img src="${src}" style="${styleString};margin-top:10px;border-radius:10px;" alt="image"/></a>
        </div>`;

        case 'multi-image':
          return `<table class="multi" style="width:100%; border-collapse:collapse;margin:10px auto !important;">
          <tr>
              <td style="width:50%;text-align:center;padding:8px; vertical-align:top;">
                  <img src="${src1}" style="border-radius:10px;object-fit:contain;height:230px !important;width:100%;pointer-events:none !important; object-fit:cover; ${styleString}" alt="image"/>
                  <a class="img-btn" href="${generateTrackingLink(link1, userId, campaignId, recipientEmail)}"  target="_blank" style="${stylebuttonString1}; display:inline-block; padding:12px 25px; text-decoration:none;">
                      ${content1}
                  </a>
              </td>
              <td style="width:50%;text-align:center;padding:8px; vertical-align:top;">
                  <img src="${src2}" style="border-radius:10px;object-fit:contain;height:230px !important;width:100%;pointer-events:none !important; object-fit:cover;${styleString}" alt="image"/>
                  <a class="img-btn" href="${generateTrackingLink(link2, userId, campaignId, recipientEmail)}" target="_blank" style="${stylebuttonString2}; display:inline-block; padding:12px 25px; text-decoration:none;">
                      ${content2}
                  </a>
              </td>
          </tr>
        </table>`;

        case 'multipleimage':
          return `<table class="multi" style="width:100%; border-collapse:collapse;margin:10px auto !important;">
          <tr>
              <td style="width:50%;text-align:center;padding:8px; vertical-align:top;">
                  <img src="${src1}" style="border-radius:10px;object-fit:contain;height:230px !important;width:100%;pointer-events:none !important; object-fit:cover;" alt="image"/>
              </td>
              <td style="width:50%;text-align:center;padding:8px; vertical-align:top;">
                  <img src="${src2}" style="border-radius:10px;object-fit:contain;height:230px !important;width:100%;pointer-events:none !important; object-fit:cover;" alt="image"/>
              </td>
          </tr>
      </table>`

        case 'head':
          return `<p class="head" style="${styleString};border-radius:10px;padding:10px;font-weight:bold;">${content}</p>`;
        case 'para':
          return `<div class="para" style="${styleString};border-radius:10px;padding:10px;">${content}</div>`;
        case 'button':
          return `<div style="margin:20px auto 0 auto;text-align:center;">
                  <a href = "${generateTrackingLink(link, userId, campaignId, recipientEmail)}"
                  target = "_blank"
                  style = "${styleString};display:inline-block;padding:12px 25px;text-decoration:none;" >
                    ${content}
                  </a>
                </div>`;
        default:
          return '';
      }
    };

    const dynamicHtml = bodyElements.map(generateHtml).join('');
    const Attachments = attachments.map(file => ({
      filename: file.originalName,
      path: file.fileUrl, // Use Cloudinary URL directly
      contentType: file.mimetype
    }));
    const trackingPixel = `<img src="https://emailcon-campaign-backend-u45r.onrender.com/api/stud/track-email-open?emailId=${encodeURIComponent(recipientEmail)}&userId=${userId}&campaignId=${campaignId}&t=${Date.now()}" width="1" height="1" style="display:none;" />`;

    const mailOptions = {
      from: `"${aliasName}" <${email}>`,
      to: recipientEmail,
      subject: subject,
      attachments: Attachments,
      html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
              
             .img-case {
  margin:0 auto !important;
  text-align:center !important;
  display:block;
  width:100%;
  max-width: 650px; /* Adjust as needed */
}

.img-case img {
  display: block;
  margin: 0 auto; /* Ensures the image is centered */
  max-width: 100%;
  height: auto; /* Ensures the image maintains its aspect ratio */
}
           

              @media(max-width:768px) {
                .main { width: 330px !important; }
                .img-case { width: 330px !important; }

                .para{
                  font-size:15px !important;
                }
                .img-para{
                  font-size:12px !important;
                }
                  .image-text tr{
    display: flex !important;
    flex-wrap: nowrap !important;
    justify-content: space-between !important;
  }
                
  /* Keep images inline on small screens */
  .multi tr {
    display: flex !important;
    flex-wrap: nowrap !important;
    justify-content: space-between !important;
  }
  .multi tr td {
    width: 48% !important; /* Ensures images stay side by side */
    padding: 5px !important;
  }
  .multi tr td img {
    height: 150px !important; /* Adjust image height for better fit */
    width: 100% !important;
    object-fit: cover !important;
  } 

                // .multimain td{
                //   padding:5px 8px 0px 0px !important;
                // }
                // .multi-img{
                //   width:100% !important;
                //   max-width:170px !important;
                //   height:auto !important;
                //   object-fit: contain !important; 

                // }
                 .img-btn{
                  width:85% !important;
                  margin:10px auto !important;
                  font-size:10px !important;
                  padding:10px !important;
                  
                }
                .head{
                  font-size:20px !important;
                }
              }
            </style>
          </head>
          <body>
            <div style="display:none !important; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
              ${previewtext}
            </div>
              <div class="main" style="background-color:${bgColor || "white"}; box-shadow:0 4px 8px rgba(0, 0, 0, 0.2); border:1px solid rgb(255, 245, 245); padding:20px;width:650px;height:auto;border-radius:10px;margin:0 auto;">
                ${dynamicHtml}
                 ${trackingPixel}
              </div>
          </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to: ${recipientEmail}`);
    res.send('All Email sent successfully!');
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send(error.toString());
  }
});

//getting particular students in selected group for send bulk
router.get("/groups/:groupId/students", async (req, res) => {
  const {
    groupId
  } = req.params;
  const students = await Student.find({
    group: groupId
  });
  res.json(students);
});
//create group
router.post('/groups', async (req, res) => {
  const {
    name,
    userId
  } = req.body;

  if (!userId) {
    return res.status(400).send({
      message: "User ID is required"
    });
  }

  try {
    // Check if the group name already exists for the user
    const existingGroup = await Group.findOne({
      name,
      user: userId
    });
    if (existingGroup) {
      return res.status(400).send({
        message: "Group name already exists for this user"
      });
    }
    // Create a new group
    const group = new Group({
      name,
      user: userId
    }); // Correct object structure
    await group.save();
    res.status(201).send(group);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Error creating group"
    });
  }
});


//add student to selected group through excel

router.post("/students/upload", async (req, res) => {
  try {
    // console.log("Received data:", req.body); // Debugging
    await Student.insertMany(req.body);
    res.status(201).send("Students uploaded successfully");
  } catch (error) {
    console.error("Error inserting students:", error);
    res.status(500).send("Error uploading students");
  }
});

//add manually student to selected group
router.post("/students/manual", async (req, res) => {
  const student = new Student(req.body);
  await student.save();
  res.status(201).send(student);
});

//getting all students in corresponting group
router.get("/students", async (req, res) => {
  const students = await Student.find().populate("group");
  res.send(students);
});

//getting all groups
router.get('/groups/:userId', async (req, res) => {
  try {
    const groups = await Group.find({
      user: req.params.userId
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching groups'
    });
  }
});

// 2. DELETE route to delete a group and its associated students
router.delete('/groups/:id', async (req, res) => {
  try {
    const groupId = req.params.id;
    await Group.findByIdAndDelete(groupId); // Delete group
    await Student.deleteMany({
      group: groupId
    }); // Delete all students in that group
    res.status(200).json({
      message: 'Group and associated students deleted'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting group and students'
    });
  }
});

// 3. GET route to fetch all students, with optional filtering by group
router.get('/students', async (req, res) => {
  try {
    const {
      group
    } = req.query; // Filter by group if provided
    const filter = group ? {
      group
    } : {}; // Apply filter if group is provided
    const students = await Student.find(filter);
    res.json(students);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching students'
    });
  }
});

// 4. DELETE route to delete selected students
router.delete('/students', async (req, res) => {
  try {
    const {
      studentIds
    } = req.body; // Array of student IDs to delete
    await Student.deleteMany({
      _id: {
        $in: studentIds
      }
    }); // Delete students
    res.status(200).json({
      message: 'Selected students deleted'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting students'
    });
  }
});

// 5. PUT route to edit a student's details
router.put("/students/:id", async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, // Automatically update all fields, including dynamic ones
      { new: true, runValidators: true } // Return updated student and validate fields
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(updatedStudent);
  } catch (err) {
    res.status(500).json({ message: "Error updating student", error: err });
  }
});


//edit group name
router.put('/groups/:id', (req, res) => {
  const groupId = req.params.id;
  const updatedName = req.body.name;

  // Assuming you are using MongoDB with Mongoose
  Group.findByIdAndUpdate(groupId, {
    name: updatedName
  }, {
    new: true
  })
    .then(updatedGroup => res.json(updatedGroup))
    .catch(err => res.status(400).send(err));
});

//create campaign
router.post('/campaign', async (req, res) => {
  const {
    camname,
    userId
  } = req.body;

  if (!userId) {
    return res.status(400).send({
      message: "User ID is required"
    });
  }

  try {
    // Check if a campaign with the same name already exists for the user
    const existingCampaign = await Campaign.findOne({
      camname,
      user: userId
    });
    if (existingCampaign) {
      return res.status(400).send({
        message: "Campaign with this name already exists for the user"
      });
    }
    // Create a new campaign
    const campaign = new Campaign({
      camname,
      user: userId
    });
    const savedCampaign = await campaign.save();
    const campaignData = {
      id: savedCampaign._id,
      camname: savedCampaign.camname,
    };

    res.json({
      campaign: campaignData
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Error creating campaign"
    });
  }
});
//Save template
router.post('/template', async (req, res) => {
  const {
    temname,
    previewContent,
    bgColor,
    userId
  } = req.body;

  if (!userId) {
    return res.status(400).send({
      message: "User ID is required"
    });
  }

  try {
    // Check if a template with the same name already exists for the user
    const existingTemplate = await Template.findOne({
      temname,
      user: userId
    });
    if (existingTemplate) {
      return res.status(400).send({
        message: "Template with this name already exists for the user"
      });
    }
    // Create a new template
    const template = new Template({
      temname,
      previewContent,
      bgColor,
      user: userId
    });
    await template.save();
    res.status(201).send(template);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Error saving template"
    });
  }
});

//getting all template
router.get('/templates/:userId', async (req, res) => {
  try {
    const templates = await Template.find({
      user: req.params.userId
    });
    res.json(templates);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching templates'
    });
  }
});

//getting all campaign history
router.get('/campaigns/:userId', async (req, res) => {
  try {
    const campaigns = await Camhistory.find({
      user: req.params.userId
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching campaigns'
    });
  }
});
// Store campaign history
router.post("/camhistory", async (req, res) => {
  try {
    const {
      campaignname,
      groupname,
      totalcount,
      sendcount,
      failedcount,
      sentEmails,
      failedEmails,
      recipients,
      subject,
      previewtext,
      scheduledTime,
      attachments,
      status,
      progress, aliasName,
      senddate,
      previewContent,
      exceldata,
      bgColor,
      user,
      groupId,
    } = req.body;

    const campaignHistory = new Camhistory({
      campaignname,
      recipients,
      groupname,
      totalcount,
      sendcount,
      failedcount,
      exceldata,
      subject,
      previewtext,
      sentEmails,
      attachments,
      failedEmails,
      scheduledTime, aliasName,
      status,
      progress,
      senddate,
      previewContent,
      bgColor,
      user,
      groupId,
    });

    const savedCampaign = await campaignHistory.save();
    res.json({
      id: savedCampaign._id,
      message: "Campaign history saved successfully"
    });
  } catch (error) {
    console.error("Error creating campaign history:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
});
// Route to get campaign data by ID
router.get("/getcamhistory/:campaignId", async (req, res) => {
  try {
    const {
      campaignId
    } = req.params;

    // Fetch campaign from MongoDB
    const campaign = await Camhistory.findById(campaignId);

    // If no campaign found, return 404
    if (!campaign) {
      return res.status(404).json({
        message: "Campaignhistory not found"
      });
    }

    // Send the campaign data as JSON
    res.status(200).json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
});


// Update Campaign History by ID
router.put("/camhistory/:id", async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const {
      sendcount,
      failedcount,
      sentEmails,
      failedEmails,
      scheduledTime,
      status,
      progress
    } = req.body;

    // Find the campaign by ID and update it
    const updatedCampaign = await Camhistory.findByIdAndUpdate(
      id, {
      sendcount,
      failedcount,
      sentEmails,
      failedEmails,
      scheduledTime,
      status,
      progress
    }, {
      new: true
    }
    );

    if (!updatedCampaign) {
      return res.status(404).json({
        message: "Campaign history not found"
      });
    }

    res.json({
      message: "Campaign history updated successfully",
      updatedCampaign
    });
  } catch (error) {
    console.error("Error updating campaign history:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
});

router.get("/track-email-open", async (req, res) => {
  const { emailId, userId, campaignId } = req.query;

  if (!emailId || !userId || !campaignId) {
    console.error("❌ Missing parameters:", { emailId, userId, campaignId });
    return res.status(400).json({ error: "Missing required parameters" });
  }

  console.log(`✅ Email opened: userId=${userId}, campaignId=${campaignId}`);

  try {
    // Upsert: Update existing entry, or insert if not found
    await EmailOpen.findOneAndUpdate(
      { emailId, userId, campaignId }, // Query condition
      {
        $set: {
          sendTime: new Date(),
          ipAddress: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
          userAgent: req.headers["user-agent"],
        },
      },
      { upsert: true, new: true } // If not found, create a new entry
    );

    // Return a 1x1 transparent pixel
    const transparentPixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAgAB/dfH1FAAAAAASUVORK5CYII=",
      "base64"
    );

    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": transparentPixel.length,
    });

    res.end(transparentPixel);
  } catch (err) {
    console.error("❌ Error in track-email-open:", err);
    res.status(500).send("Server Error");
  }
});

router.get("/get-email-open-count", async (req, res) => {
  const { userId, campaignId } = req.query;

  if (!userId || !campaignId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // Fetch emails with valid emailId
    const emailOpens = await EmailOpen.find({ userId, campaignId })
      .select("emailId timestamp sendTime")
      .lean(); // Convert Mongoose objects to plain JS objects

    // Check if emails exist
    if (!emailOpens || emailOpens.length === 0) {
      return res.json({ count: 0, emails: [] });
    }

    // Log data for debugging
    console.log(`Email open details for user ${userId}, campaign ${campaignId}:`, emailOpens);

    res.json({ count: emailOpens.length, emails: emailOpens });
  } catch (error) {
    console.error("Error fetching email open details:", error);
    res.status(500).send("Server Error");
  }
});

// Track URL Click
router.get("/track-click", async (req, res) => {
  const { userId, campaignId, url, emailId } = req.query;

  if (!userId || !campaignId || !url || !emailId) {
    console.error("❌ Missing parameters:", { userId, campaignId, url, emailId });
    return res.status(400).json({ error: "Missing required parameters" });
  }

  console.log(`✅ Clicked URL: ${url} | userId=${userId} | campaignId=${campaignId} | emailId=${emailId}`);

  try {
    // Upsert to prevent duplicate click entries
    await ClickTracking.findOneAndUpdate(
      { userId, campaignId, emailId, clickedUrl: url }, // Find by unique combination
      { $set: { clickedAt: new Date() } }, // Update the timestamp
      { upsert: true, new: true } // If not found, create new entry
    );

    // Redirect the user to the target URL
    res.redirect(url);

  } catch (err) {
    console.error("❌ Error in track-click:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/get-click", async (req, res) => {
  const { userId, campaignId } = req.query;

  if (!userId || !campaignId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // 1️⃣ Count unique emails who clicked at least one link
    const uniqueEmails = await ClickTracking.aggregate([
      { $match: { userId, campaignId } },
      { $group: { _id: "$emailId" } } // Group by unique emailId
    ]);

    // 2️⃣ Get URLs with their corresponding emails + timestamps
    const urlClicks = await ClickTracking.aggregate([
      { $match: { userId, campaignId } },
      {
        $group: {
          _id: "$clickedUrl",
          clicks: {
            $push: { emailId: "$emailId", timestamp: "$timestamp" }
          }
        }
      },
      { $project: { clickedUrl: "$_id", clicks: 1, _id: 0 } } // Format output
    ]);

    res.json({ count: uniqueEmails.length, urls: urlClicks, emails: uniqueEmails });
  } catch (error) {
    console.error("Error fetching unique click count:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;