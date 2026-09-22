import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const problem = await prisma.problem.findUnique({
      where: {
        id,
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

    return Response.json(
      {
        problem,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get problem error:", error);

    return Response.json(
      {
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const problem = await prisma.problem.findUnique({
      where: {
        id,
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

    await prisma.problem.delete({
      where: {
        id,
      },
    });

    return Response.json(
      {
        message: "Problem deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete problem error:", error);

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
    const { id } = await params;
    const body = await req.json();

    const { title, description, difficulty, constraints } = body;

    // Check if problem exists
    const problem = await prisma.problem.findUnique({
      where: { id },
    });

    if (!problem) {
      return Response.json(
        {
          message: "Problem not found",
        },
        { status: 404 },
      );
    }

    // Validate fields if provided
    if (
      title !== undefined &&
      (typeof title !== "string" || !title.trim())
    ) {
      return Response.json(
        {
          message: "Invalid title",
        },
        { status: 400 },
      );
    }

    if (
      description !== undefined &&
      (typeof description !== "string" || !description.trim())
    ) {
      return Response.json(
        {
          message: "Invalid description",
        },
        { status: 400 },
      );
    }

    if (
      constraints !== undefined &&
      (typeof constraints !== "string" || !constraints.trim())
    ) {
      return Response.json(
        {
          message: "Invalid constraints",
        },
        { status: 400 },
      );
    }

    const allowedDifficulties = ["EASY", "MEDIUM", "HARD"];

    if (
      difficulty !== undefined &&
      !allowedDifficulties.includes(
        String(difficulty).trim().toUpperCase(),
      )
    ) {
      return Response.json(
        {
          message: "Difficulty must be EASY, MEDIUM or HARD",
        },
        { status: 400 },
      );
    }

    const updatedProblem = await prisma.problem.update({
      where: {
        id,
      },
      data: {
        ...(title !== undefined && {
          title: title.trim(),
        }),

        ...(description !== undefined && {
          description: description.trim(),
        }),

        ...(difficulty !== undefined && {
          difficulty: difficulty.trim().toUpperCase(),
        }),

        ...(constraints !== undefined && {
          constraints: constraints.trim(),
        }),
      },
    });

    return Response.json(
      {
        message: "Problem updated successfully",
        problem: updatedProblem,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update problem error:", error);

    return Response.json(
      {
        message: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
