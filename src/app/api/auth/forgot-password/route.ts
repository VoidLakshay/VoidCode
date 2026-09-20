import crypto from "crypto";
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

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Token expires in 15 minutes
    const resetPasswordExpiry = new Date(
      Date.now() + 15 * 60 * 1000
    );

    // Store token
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpiry,
      },
    });

    // Reset password frontend URL
    const resetLink = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password/${resetToken}`;

    // Send reset email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Reset your VoidCode password",
      html: `
        <h2>Reset your VoidCode password</h2>

        <p>
          We received a request to reset your password.
        </p>

        <p>
          Click the button below to reset your password.
        </p>

        <a
          href="${resetLink}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Reset Password
        </a>

        <p>
          This link will expire in 15 minutes.
        </p>

        <p>
          If you didn't request a password reset,
          you can safely ignore this email.
        </p>
      `,
    });

    return Response.json(
      {
        success: true,
        message: "Password reset link sent to your email",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);

    return Response.json(
      {
        message: "Forgot password failed",
      },
      { status: 500 }
    );
  }
}