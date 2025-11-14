import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getUserIdFromSession } from "@/lib/auth";

// GET /api/profile - Lấy thông tin profile của user hiện tại
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("sid")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = await getUserIdFromSession(sessionId);

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const db = getDB();
    const result = await db.query(
      "SELECT id, email, display_name, phone, avatar_url, bio, created_at FROM users WHERE id = $1",
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Cập nhật thông tin profile
export async function PUT(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("sid")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = await getUserIdFromSession(sessionId);

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { display_name, phone, avatar_url, bio } = body;

    // Validate input
    if (display_name !== undefined && typeof display_name !== "string") {
      return NextResponse.json(
        { error: "display_name must be a string" },
        { status: 400 }
      );
    }

    if (phone !== undefined && phone !== null && typeof phone !== "string") {
      return NextResponse.json(
        { error: "phone must be a string" },
        { status: 400 }
      );
    }

    if (avatar_url !== undefined && avatar_url !== null && typeof avatar_url !== "string") {
      return NextResponse.json(
        { error: "avatar_url must be a string" },
        { status: 400 }
      );
    }

    if (bio !== undefined && bio !== null && typeof bio !== "string") {
      return NextResponse.json(
        { error: "bio must be a string" },
        { status: 400 }
      );
    }

    const db = getDB();
    const result = await db.query(
      `UPDATE users
       SET display_name = COALESCE($1, display_name),
           phone = $2,
           avatar_url = $3,
           bio = $4
       WHERE id = $5
       RETURNING id, email, display_name, phone, avatar_url, bio, created_at`,
      [display_name, phone, avatar_url, bio, userId]
    );

    const updatedUser = result.rows[0];

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
