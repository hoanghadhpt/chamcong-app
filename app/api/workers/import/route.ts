import { NextRequest, NextResponse } from "next/server";
import { importWorkers, parseCSV } from "@/lib/workers";
import { getUserIdFromSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const content = await file.text();
    const records = parseCSV(content);

    const result = importWorkers(userId, records as any);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error importing workers:", error);
    return NextResponse.json(
      { error: "Failed to import workers" },
      { status: 500 }
    );
  }
}
