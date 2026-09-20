import { prisma } from "@/lib/prisma.js";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    // 1. Validate input
    if (!email || !otp) {
      return Response.json(
        {
          message: "Email and OTP are required",
        },
        { status: 400 },
      );
    }

    // 2. Find user
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
        { status: 404 },
      );
    }

    // 3. Check if already verified
    if (user.isVerified) {
      return Response.json(
        {
          message: "Email is already verified",
        },
        { status: 400 },
      );
    }

    // 4. Check if OTP exists
    if (!user.emailVerifyOtpHash) {
      return Response.json(
        {
          message: "OTP not found. Please request a new OTP.",
        },
        { status: 400 },
      );
    }

    // 5. Check OTP expiry
    if (!user.emailVerifyOtpExpiry || user.emailVerifyOtpExpiry < new Date()) {
      return Response.json(
        {
          message: "OTP has expired. Please request a new OTP.",
        },
        { status: 400 },
      );
    }

    // 6. Check maximum attempts
    if (user.emailVerifyOtpAttempts >= 5) {
      return Response.json(
        {
          message: "Too many failed attempts. Please request a new OTP.",
        },
        { status: 429 },
      );
    }

    // 7. Compare OTP
    const isValidOtp = await bcrypt.compare(
      otp.toString(),
      user.emailVerifyOtpHash,
    );

    // 8. Invalid OTP
    if (!isValidOtp) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          emailVerifyOtpAttempts: {
            increment: 1,
          },
        },
      });

      return Response.json(
        {
          message: "Invalid OTP",
        },
        { status: 400 },
      );
    }

    // 9. OTP valid → verify email
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isVerified: true,

        // Remove OTP after successful verification
        emailVerifyOtpHash: null,
        emailVerifyOtpExpiry: null,
        emailVerifyOtpAttempts: 0,
      },
    });

    // 10. Success
    return Response.json(
      {
        success: true,
        message: "Email verified successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("OTP verification error:", error);

    return Response.json(
      {
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
