import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 1. Check problem
    const problem = await prisma.problem.findUnique({
      where: {
        id,
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

    // 2. Parse body
    const body = await req.json();

    const { input, expectedOutput, isHidden = true } = body;

    // 3. Validate input
    if (typeof input !== "string" || typeof expectedOutput !== "string") {
      return Response.json(
        {
          message: "Input and expectedOutput must be strings",
        },
        { status: 400 },
      );
    }

    // 4. Validate empty values
    if (!input.trim() || !expectedOutput.trim()) {
      return Response.json(
        {
          message: "Input and expectedOutput are required",
        },
        { status: 400 },
      );
    }

    // 5. Validate isHidden
    if (typeof isHidden !== "boolean") {
      return Response.json(
        {
          message: "isHidden must be a boolean",
        },
        { status: 400 },
      );
    }

    // 6. Create test case
    const testCase = await prisma.testCase.create({
      data: {
        problemId: id,
        input,
        expectedOutput,
        isHidden,
      },
    });

    // 7. Response
    return Response.json(
      {
        message: "Test case created successfully",
        testCase,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create test case error:", error);

    return Response.json(
      {
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 1. Check problem
    const problem = await prisma.problem.findUnique({
      where: {
        id,
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

    // 2. Get test cases
    const testCases = await prisma.testCase.findMany({
      where: {
        problemId: id,
        isHidden: false,
      },
      select: {
        id: true,
        input: true,
        expectedOutput: true,
      },
    });

    // 3. Response
    return Response.json(
      {
        message: "Test cases retrieved successfully",
        testCases,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get test cases error:", error);

    return Response.json(
      {
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Get test case ID from URL
    const { id } = await params;

    // 2. Check if test case exists
    const testCase = await prisma.testCase.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!testCase) {
      return Response.json(
        {
          message: "Test case not found",
        },
        { status: 404 },
      );
    }

    // 3. Parse body
    const body = await req.json();

    const { input, expectedOutput, isHidden } = body;

    // 4. Validate provided fields
    if (input !== undefined && typeof input !== "string") {
      return Response.json(
        {
          message: "Input must be a string",
        },
        { status: 400 },
      );
    }

    if (
      expectedOutput !== undefined &&
      typeof expectedOutput !== "string"
    ) {
      return Response.json(
        {
          message: "Expected output must be a string",
        },
        { status: 400 },
      );
    }

    if (isHidden !== undefined && typeof isHidden !== "boolean") {
      return Response.json(
        {
          message: "isHidden must be a boolean",
        },
        { status: 400 },
      );
    }

    // 5. Make sure at least one field is provided
    if (
      input === undefined &&
      expectedOutput === undefined &&
      isHidden === undefined
    ) {
      return Response.json(
        {
          message: "At least one field is required to update",
        },
        { status: 400 },
      );
    }

    // 6. Update test case
    const updatedTestCase = await prisma.testCase.update({
      where: {
        id,
      },
      data: {
        ...(input !== undefined && { input }),
        ...(expectedOutput !== undefined && { expectedOutput }),
        ...(isHidden !== undefined && { isHidden }),
      },
    });

    // 7. Response
    return Response.json(
      {
        message: "Test case updated successfully",
        testCase: updatedTestCase,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update test case error:", error);

    return Response.json(
      {
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}