import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  getUserByEmail,
  verifyPassword,
} from "@/lib/auth";

const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const passwordMatch = await verifyPassword(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();
    const session = createSession(user.id, expiresAt);

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: { id: user.id, email: user.email, displayName: user.display_name },
      },
      { status: 200 }
    );

    // Set HttpOnly cookie
    response.cookies.set({
      name: "sid",
      value: session.id,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SESSION_DURATION / 1000, // convert to seconds
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
