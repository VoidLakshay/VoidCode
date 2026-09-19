import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import sendVerificationEmail from "./sendVerificationEmail";

//registeration


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, userName, email, password } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return new Response(JSON.stringify({ error: "User already exists" }), {
        status: 400,
      });
    }

    if (!password || password.length < 8) {
      return new Response(JSON.stringify({ error: "Password too short" }), {
        status: 400,
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
  data: {
    name,
    userName,
    email,
    password: hashedPassword,
  },
  select: {
    id: true,
    name: true,
    userName: true,
    email: true,
    isVerified: true,
    photoUrl: true,
    createdAt: true,
  },
});
//send verification email
await sendVerificationEmail(user.id, user.email);

    return new Response(
  JSON.stringify({
    message: "Registration successful. Please verify your email.",
    user,
  }),
  {
    status: 201,
    headers: {
      "Content-Type": "application/json",
    },
  }
);
  } catch (error) {
    console.error("Registration error:", error);

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}


