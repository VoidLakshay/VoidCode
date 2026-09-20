import crypto from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import transporter from "../register/nodemailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json(
        {
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      return Response.json(
        {
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Generate 6-digit OTP
    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    // OTP expires in 5 minutes
    const expiry = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // Hash OTP before storing
    const hashedOtp = await bcrypt.hash(otp, 10);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetOtpHash: hashedOtp,
        resetOtpExpiry: expiry,
      },
    });

    // Send OTP through email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your VoidCode password reset OTP",
      html: `
        <h2>Password Reset</h2>

        <p>Your password reset OTP is:</p>

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
          If you didn't request a password reset,
          you can safely ignore this email.
        </p>
      `,
    });

    return Response.json(
      {
        success: true,
        message: "Password reset OTP sent to your email",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset OTP error:", error);

    return Response.json(
      {
        message: "OTP generation failed",
      },
      { status: 500 }
    );
  }
}