import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/jwt";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Get access token from cookie
    const token = req.headers
      .get("cookie")
      ?.split("; ")
      .find((cookie) => cookie.startsWith("accessToken="))
      ?.split("=")[1];

    if (!token) {
      return Response.json(
        {
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    // 2. Verify token and get user ID
    let userId: string;

    try {
      const payload = verifyAccessToken(token);
      userId = payload.id;
    } catch {
      return Response.json(
        {
          message: "Invalid or expired access token",
        },
        { status: 401 },
      );
    }

    // 3. Get submission ID from URL
    const { id } = await params;

    // 4. Find submission belonging to current user
    const submission = await prisma.submission.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        problemId: true,
        language: true,
        status: true,
        verdict: true,
        executionTime: true,
        memoryUsed: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 5. Submission not found
    if (!submission) {
      return Response.json(
        {
          message: "Submission not found",
        },
        { status: 404 },
      );
    }

    // 6. Response
    return Response.json(
      {
        message: "Submission retrieved successfully",
        submission,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get submission error:", error);

    return Response.json(
      {
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
