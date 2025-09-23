require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const transporter = nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Email sending function (shared logic)
async function sendEmail(formData) {
  const { name, email, contact, productDetails, message } = formData;
  
  const mailOptions = {
    from: `"Website Contact" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject: "New Form Submission",
    html: `
      <h3>New Message from Website Form</h3>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      ${contact ? `<p><b>Contact:</b> ${contact}</p>` : ''}
      ${productDetails ? `<p><b>Product Details:</b> ${productDetails}</p>` : ''}
      <p><b>Message:</b> ${message}</p>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

// Handle both /send and /api/send routes for compatibility
app.post(["/send", "/api/send"], async (req, res) => {
  try {
    const { name, email, message, contact, productDetails } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: "Name, email, and message are required" 
      });
    }

    const info = await sendEmail({ name, email, contact, productDetails, message });
    console.log("✅ Message sent: %s", info.messageId);
    
    res.status(200).json({ 
      success: true, 
      message: "Email sent successfully",
      messageId: info.messageId 
    });

  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Error sending email", 
      error: error.message 
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});