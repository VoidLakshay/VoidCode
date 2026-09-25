import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/jwt";

export async function POST(req: Request) {
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

    // 3. Parse request body
    const body = await req.json();

    const { problemId, code, language } = body;

    // 4. Validate required fields
    if (
      typeof problemId !== "string" ||
      typeof code !== "string" ||
      typeof language !== "string"
    ) {
      return Response.json(
        {
          message: "Invalid input",
        },
        { status: 400 },
      );
    }

    // 5. Clean input
    const cleanProblemId = problemId.trim();
    const cleanLanguage = language.trim().toUpperCase();

    // Don't modify source code
    const cleanCode = code;

    // 6. Check empty values
    if (!cleanProblemId || !cleanCode.trim() || !cleanLanguage) {
      return Response.json(
        {
          message: "All fields are required",
        },
        { status: 400 },
      );
    }

    // 7. Validate language
    const allowedLanguages = [
      "PYTHON",
      "JAVASCRIPT",
      "JAVA",
      "C++",
    ];

    if (!allowedLanguages.includes(cleanLanguage)) {
      return Response.json(
        {
          message: "Invalid language",
        },
        { status: 400 },
      );
    }

    // 8. Check if problem exists
    const problem = await prisma.problem.findUnique({
      where: {
        id: cleanProblemId,
      },
      select: {
        id: true,
      },
    });

    if (!problem) {
      return Response.json(
        {
          message: "Problem not found",
        },
        { status: 404 },
      );
    }

    // 9. Create submission
    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId: cleanProblemId,
        sourceCode: cleanCode,
        language: cleanLanguage,
        status: "QUEUED",
      },
    });

    // 10. Response
    return Response.json(
      {
        message: "Submission created successfully",
        submission,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create submission error:", error);

    return Response.json(
      {
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}


export async function GET(req: Request) {
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

    // 3. Get pagination parameters
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "10");

    // 4. Validate pagination parameters
    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1
    ) {
      return Response.json(
        {
          message: "Page and limit must be positive integers",
        },
        { status: 400 },
      );
    }

    // Prevent very large requests
    const MAX_LIMIT = 50;

    if (limit > MAX_LIMIT) {
      return Response.json(
        {
          message: `Limit cannot exceed ${MAX_LIMIT}`,
        },
        { status: 400 },
      );
    }

    // 5. Calculate how many records to skip
    const skip = (page - 1) * limit;

    // 6. Fetch submissions + total count
    const [submissions, total] = await prisma.$transaction([
      prisma.submission.findMany({
        where: {
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
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),

      prisma.submission.count({
        where: {
          userId,
        },
      }),
    ]);

    // 7. Calculate pagination information
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    // 8. Response
    return Response.json(
      {
        message: "Submissions fetched successfully",
        submissions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fetch submissions error:", error);

    return Response.json(
      {
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}


