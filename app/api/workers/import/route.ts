import { NextRequest, NextResponse } from "next/server";
import {
  importWorkers,
  parseCSV,
  detectColumnMapping,
  transformRecordsByMapping,
  ColumnMapping,
} from "@/lib/workers";
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
    const action = formData.get("action") || "import"; // "detect" or "import"
    const mappingStr = formData.get("mapping") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const content = await file.text();
    const lines = content.split("\n").filter((line) => line.trim());

    if (lines.length === 0) {
      return NextResponse.json(
        { error: "File is empty" },
        { status: 400 }
      );
    }

    // Parse headers
    const headerLine = lines[0];
    const headers = headerLine
      .split(",")
      .map((h) => h.trim());

    if (action === "detect") {
      // First step: detect column mapping
      const mapping = detectColumnMapping(headers);

      return NextResponse.json({
        headers,
        mapping,
        sampleCount: Math.min(3, lines.length - 1),
        totalRows: lines.length - 1,
      });
    } else {
      // Second step: import with provided or detected mapping
      let mapping: ColumnMapping;

      if (mappingStr) {
        mapping = JSON.parse(mappingStr);
      } else {
        mapping = detectColumnMapping(headers);
      }

      const records = parseCSV(content);
      const transformedRecords = transformRecordsByMapping(records, mapping);
      const result = importWorkers(userId, transformedRecords);

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Error importing workers:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import workers" },
      { status: 500 }
    );
  }
}
