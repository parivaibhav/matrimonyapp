import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/* =========================================================
   SEND OTP EMAIL
========================================================= */

export async function sendVerificationOtp(email, otp) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  if (!"onboarding@resend.dev") {
    throw new Error("EMAIL_FROM is missing.");
  }

  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: [email],
    subject: "Your verification code",

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
            margin: 0;
            padding: 0;
            background: #f8fafc;
            font-family: Arial, Helvetica, sans-serif;
          "
        >
          <div
            style="
              max-width: 520px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 20px;
              padding: 32px;
              box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
            "
          >
            <div style="text-align: center;">
              <h1
                style="
                  margin: 0 0 10px;
                  color: #2563eb;
                  font-size: 28px;
                "
              >
                Email Verification
              </h1>

              <p
                style="
                  margin: 0;
                  color: #64748b;
                  font-size: 15px;
                "
              >
                Use the verification code below to continue.
              </p>
            </div>

            <div
              style="
                margin: 30px 0;
                padding: 22px;
                background: #eff6ff;
                border-radius: 16px;
                text-align: center;
              "
            >
              <div
                style="
                  color: #64748b;
                  font-size: 13px;
                  margin-bottom: 10px;
                "
              >
                YOUR VERIFICATION CODE
              </div>

              <div
                style="
                  color: #1d4ed8;
                  font-size: 36px;
                  font-weight: 700;
                  letter-spacing: 10px;
                "
              >
                ${otp}
              </div>
            </div>

            <p
              style="
                color: #475569;
                font-size: 14px;
                line-height: 1.6;
              "
            >
              This code expires in <strong>10 minutes</strong>.
            </p>

            <p
              style="
                color: #94a3b8;
                font-size: 13px;
                line-height: 1.6;
              "
            >
              If you did not request this code, you can safely ignore this
              email.
            </p>

            <div
              style="
                margin-top: 28px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                text-align: center;
                color: #94a3b8;
                font-size: 12px;
              "
            >
              Your Matrimony App
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error("RESEND ERROR:", error);

    throw new Error(error.message || "Unable to send verification email.");
  }

  return data;
}
