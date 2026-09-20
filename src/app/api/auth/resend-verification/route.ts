import { prisma } from "@/lib/prisma";
import sendVerificationEmail from "../register/sendVerificationEmail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // Validate email
    if (!email) {
      return Response.json(
        {
          message: "Email is required",
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
          message: "User not found",
        },
        { status: 404 },
      );
    }

    // Check if already verified
    if (user.isVerified) {
      return Response.json(
        {
          message: "Email already verified",
        },
        { status: 400 },
      );
    }

    // Generate new token + send email
    await sendVerificationEmail(user.id, user.email);

    return Response.json(
      {
        success: true,
        message: "Verification email resent successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Resend verification error:", error);

    return Response.json(
      {
        message: "Failed to resend verification email",
      },
      { status: 500 },
    );
  }
}
