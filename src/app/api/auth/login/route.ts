import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { message: "Email and password are required" },
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
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return Response.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      return Response.json(
        {
          message:
            "Email is not verified. Please verify your email.",
        },
        { status: 403 }
      );
    }

    const accessToken = generateAccessToken({
      id: user.id,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
    });

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken,
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Signin successful",
        user: {
          id: user.id,
          name: user.name,
          userName: user.userName,
          email: user.email,
          photoUrl: user.photoUrl,
          isVerified: user.isVerified,
        },
      },
      { status: 200 }
    );

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 15 * 60,
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Signin error:", error);

    return Response.json(
      {
        message: "Signin failed",
      },
      { status: 500 }
    );
  }
}