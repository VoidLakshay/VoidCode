import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 1. Parse request body
    const body = await req.json();

    const { title, description, difficulty, constraints } = body;

    // 2. Validate required fields
    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      typeof difficulty !== "string" ||
      typeof constraints !== "string"
    ) {
      return Response.json(
        {
          message: "Invalid input",
        },
        { status: 400 },
      );
    }

    // 3. Remove unnecessary spaces
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanConstraints = constraints.trim();
    const cleanDifficulty = difficulty.trim().toUpperCase();

    // 4. Check empty strings
    if (
      !cleanTitle ||
      !cleanDescription ||
      !cleanConstraints ||
      !cleanDifficulty
    ) {
      return Response.json(
        {
          message: "All fields are required",
        },
        { status: 400 },
      );
    }

    // 5. Validate difficulty
    const allowedDifficulties = ["EASY", "MEDIUM", "HARD"];

    if (!allowedDifficulties.includes(cleanDifficulty)) {
      return Response.json(
        {
          message: "Difficulty must be EASY, MEDIUM or HARD",
        },
        { status: 400 },
      );
    }

    // 6. Generate slug
    const slug = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!slug) {
      return Response.json(
        {
          message: "Invalid title",
        },
        { status: 400 },
      );
    }

    // 7. Check slug uniqueness
    const existingProblem = await prisma.problem.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (existingProblem) {
      return Response.json(
        {
          message: "A problem with this title already exists",
        },
        { status: 409 },
      );
    }

    // 8. Create problem
    const problem = await prisma.problem.create({
      data: {
        title: cleanTitle,
        slug,
        description: cleanDescription,
        difficulty: cleanDifficulty,
        constraints: cleanConstraints,
      },
    });

    // 9. Return response
    return Response.json(
      {
        message: "Problem created successfully",
        problem,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create problem error:", error);

    return Response.json(
      {
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // -----------------------------
    // 1. Read query parameters
    // -----------------------------

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const page = pageParam ? Number(pageParam) : 1;
    const requestedLimit = limitParam ? Number(limitParam) : DEFAULT_LIMIT;

    // -----------------------------
    // 2. Validate page
    // -----------------------------

    if (!Number.isInteger(page) || page < 1) {
      return Response.json(
        {
          message: "Page must be a positive integer",
        },
        { status: 400 },
      );
    }

    // -----------------------------
    // 3. Validate limit
    // -----------------------------

    if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
      return Response.json(
        {
          message: "Limit must be a positive integer",
        },
        { status: 400 },
      );
    }

    // Don't allow clients to request thousands of records
    const limit = Math.min(requestedLimit, MAX_LIMIT);

    // -----------------------------
    // 4. Calculate offset
    // -----------------------------

    const skip = (page - 1) * limit;

    // -----------------------------
    // 5. Fetch problems + total
    // -----------------------------

    const [problems, total] = await prisma.$transaction([
      prisma.problem.findMany({
        skip,
        take: limit,

        select: {
          id: true,
          problemNumber: true,
          title: true,
          slug: true,
          difficulty: true,
          createdAt: true,
        },

        orderBy: {
          problemNumber: "asc",
        },
      }),

      prisma.problem.count(),
    ]);

    // -----------------------------
    // 6. Pagination information
    // -----------------------------

    const totalPages = Math.ceil(total / limit);

    const hasMore = page < totalPages;

    // -----------------------------
    // 7. Response
    // -----------------------------

    return Response.json(
      {
        problems,

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
    console.error("Get problems error:", error);

    return Response.json(
      {
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
