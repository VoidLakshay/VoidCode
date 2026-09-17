import crypto from "crypto";
import { prisma } from "@/lib/prisma.js";
import transporter from "./nodemailer.js";
import bcrypt from "bcrypt";

const sendVerificationEmailOtp = async (
  userId: string,
  email: string
) => {
  // 1. Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 1000000).toString();

  // 2. OTP expires in 5 minutes
  const otpExpiry = new Date(
    Date.now() + 1000 * 60 * 5
  );

  // 3. Hash OTP before storing in DB
  const hashedOtp = await bcrypt.hash(otp, 10);

  // 4. Store hashed OTP + expiry
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      emailVerifyOtpHash: hashedOtp,
      emailVerifyOtpExpiry: otpExpiry,
    },
  });

  // 5. Send plain OTP to user's email
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your VoidCode verification code",
    html: `
      <h2>Welcome to VoidCode 👋</h2>

      <p>Your verification code is:</p>

      <p
        style="
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 6px;
        "
      >
        ${otp}
      </p>

      <p>This OTP will expire in 5 minutes.</p>

      <p>
        If you didn't create this account,
        you can safely ignore this email.
      </p>
    `,
  });
};

export default sendVerificationEmailOtp;