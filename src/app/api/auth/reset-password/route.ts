import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    // Validate input
    if (!token || !newPassword) {
      return Response.json(
        {
          message: "Token and new password are required",
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

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return Response.json(
        {
          message: "Invalid or expired token",
        },
        { status: 400 },
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and invalidate reset token
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
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
    console.error("Reset password error:", error);

    return Response.json(
      {
        message: "Reset password failed",
      },
      { status: 500 },
    );
  }
}
