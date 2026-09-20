import { prisma } from "@/lib/prisma";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Get refresh token from cookie
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          message: "Refresh token missing",
        },
        { status: 401 }
      );
    }

    // 2. Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as TokenPayload;

    // 3. Find user
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    // 4. Check stored refresh token
    if (!user || user.refreshToken !== refreshToken) {
      return NextResponse.json(
        {
          message: "Invalid refresh token",
        },
        { status: 401 }
      );
    }

    // 5. Generate new tokens
    const newAccessToken = generateAccessToken({
      id: user.id,
    });

    const newRefreshToken = generateRefreshToken({
      id: user.id,
    });

    // 6. Refresh token rotation
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: newRefreshToken,
      },
    });

    // 7. Create response
    const response = NextResponse.json(
      {
        success: true,
        message: "Token refreshed",
      },
      { status: 200 }
    );

    // 8. Set new access token
    response.cookies.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 15 * 60,
    });

    // 9. Set new refresh token
    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Refresh token error:", error);

    return NextResponse.json(
      {
        message: "Refresh failed",
      },
      { status: 401 }
    );
  }
}