import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const token = searchParams.get("token");

    if (!token) {
      return Response.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return Response.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });

    return Response.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verification error:", error);

    return Response.json(
      { message: "Verification failed" },
      { status: 500 }
    );
  }
}