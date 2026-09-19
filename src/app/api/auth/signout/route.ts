import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
   try {
  const refreshToken = req.cookies.get("refreshToken")?.value;

    // REMOVE REFRESH TOKEN FROM DB

    if (refreshToken) {
      await prisma.user.updateMany({
        where: {
          refreshToken,
        },

        data: {
          refreshToken: null,
        },
      });
    }

    const response = NextResponse.json({ success: true, message: "Signout successful" }, { status: 200 });

    // clear cookies by setting empty value and past expiry
    response.cookies.set("accessToken", "", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      expires: new Date(0),
    });

    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.log(error);

    return NextResponse.json({ message: "Signout failed" }, { status: 500 });
  }
};
