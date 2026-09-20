import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    // Validate input
    if (!email || !otp || !newPassword) {
      return Response.json(
        {
          message: "Email, OTP and new password are required",
        },
        { status: 400 },
      );
    }

    // Validate password
    if (newPassword.length < 8) {
      return Response.json(
        {
          message: "Password must be at least 8 characters",
        },
        { status: 400 },
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      return Response.json(
        {
          message: "Invalid or expired OTP",
        },
        { status: 400 },
      );
    }

    // Check OTP exists
    if (!user.resetOtpHash) {
      return Response.json(
        {
          message: "Invalid or expired OTP",
        },
        { status: 400 },
      );
    }

    // Check OTP expiry
    if (!user.resetOtpExpiry || user.resetOtpExpiry <= new Date()) {
      return Response.json(
        {
          message: "Invalid or expired OTP",
        },
        { status: 400 },
      );
    }

    // Compare entered OTP with stored hash
    const isValidOtp = await bcrypt.compare(otp.toString(), user.resetOtpHash);

    if (!isValidOtp) {
      return Response.json(
        {
          message: "Invalid or expired OTP",
        },
        { status: 400 },
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password + invalidate OTP + sessions
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,

        resetOtpHash: null,
        resetOtpExpiry: null,

        // Invalidate existing login session
        refreshToken: null,
      },
    });

    return Response.json(
      {
        success: true,
        message: "Password reset successful",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Verify reset OTP error:", error);

    return Response.json(
      {
        message: "OTP verification failed",
      },
      { status: 500 },
    );
  }
}
