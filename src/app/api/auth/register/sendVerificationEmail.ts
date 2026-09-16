import crypto from "crypto";
import { prisma } from "@/lib/prisma.js";
import transporter from "./nodemailer.js";

const sendVerificationEmail = async (
  userId: string,
  email: string
) => {
  const verifyToken = crypto.randomBytes(32).toString("hex");

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      emailVerifyToken: verifyToken,
      emailVerifyExpiry: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
    },
  });

 const verifyUrl =
`${process.env.FRONTEND_URL || "http://localhost:5173"}/verify/${verifyToken}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify your Voidcode Account",
    html: `
      <h2>Welcome to Voidcode 👋</h2>

      <p>Click the button below to verify your email address.</p>

      <a
        href="${verifyUrl}"
        style="
          display:inline-block;
          padding:12px 20px;
          background:#ff0000;
          color:#ffffff;
          text-decoration:none;
          border-radius:6px;
          font-weight:bold;
        "
      >
        Verify Email
      </a>

      <p style="margin-top:20px">
        This link will expire in 1 hour.
      </p>

      <p>If you didn't create this account, you can safely ignore this email.</p>
    `,
  });
};

export default sendVerificationEmail;