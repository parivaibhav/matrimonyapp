import nodemailer from "nodemailer";

/* =========================================================
   SMTP CONFIG
========================================================= */

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

/* =========================================================
   VALIDATE CONFIG
========================================================= */

if (!SMTP_USER) {
  console.warn("WARNING: SMTP_USER is missing.");
}

if (!SMTP_PASS) {
  console.warn("WARNING: SMTP_PASS is missing.");
}

/* =========================================================
   NODEMAILER TRANSPORTER
========================================================= */

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",

  // Use 587 instead of 465
  port: 587,

  // STARTTLS
  secure: false,
  requireTLS: true,

  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },

  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

/* =========================================================
   VERIFY
========================================================= */

export async function verifyEmailTransport() {
  try {
    await transporter.verify();

    console.log("EMAIL SMTP CONNECTION: READY");

    return true;
  } catch (error) {
    console.error("EMAIL SMTP CONNECTION ERROR:", error.message);

    return false;
  }
}

/* =========================================================
   SEND OTP
========================================================= */

export async function sendVerificationOtp(email, otp) {
  if (!SMTP_USER) {
    throw new Error("SMTP_USER is missing.");
  }

  if (!SMTP_PASS) {
    throw new Error("SMTP_PASS is missing.");
  }

  if (!email) {
    throw new Error("Recipient email is missing.");
  }

  if (!otp) {
    throw new Error("OTP is missing.");
  }

  try {
    const info = await transporter.sendMail({
      from: {
        name: "Your Matrimony App",
        address: SMTP_FROM,
      },

      to: email,

      subject: "Your Matrimony App verification code",

      text: `
Your Matrimony App

Your verification code is:

${otp}

This code expires in 10 minutes.

If you did not request this code, you can safely ignore this email.
      `.trim(),

      html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Email Verification</title>
</head>

<body
style="
margin:0;
padding:0;
background:#f8fafc;
font-family:Arial,Helvetica,sans-serif;
"
>

<div
style="
max-width:520px;
margin:40px auto;
padding:32px;
background:#ffffff;
border-radius:20px;
"
>

<div style="text-align:center;">

<h1
style="
margin:0 0 8px;
color:#0f172a;
font-size:26px;
font-weight:800;
"
>
Verify your email
</h1>

<p
style="
margin:0;
color:#64748b;
font-size:15px;
line-height:1.6;
"
>
Use the verification code below to continue.
</p>

</div>

<div
style="
margin:30px 0;
padding:25px;
background:#eff6ff;
border-radius:16px;
text-align:center;
"
>

<div
style="
margin-bottom:12px;
color:#64748b;
font-size:12px;
font-weight:700;
letter-spacing:1px;
"
>
VERIFICATION CODE
</div>

<div
style="
color:#1d4ed8;
font-size:38px;
font-weight:800;
letter-spacing:9px;
"
>
${otp}
</div>

</div>

<p
style="
color:#475569;
font-size:14px;
line-height:1.7;
"
>
Your verification code expires in
<strong>10 minutes</strong>.
</p>

<p
style="
color:#64748b;
font-size:13px;
line-height:1.7;
"
>
If you did not request this code, you can safely ignore this email.
Never share your verification code with anyone.
</p>

</div>

</body>
</html>
      `,
    });

    console.log("OTP EMAIL SENT:", info.messageId);

    return info;
  } catch (error) {
    console.error("NODEMAILER ERROR:", error);

    throw new Error(error?.message || "Unable to send verification email.");
  }
}
