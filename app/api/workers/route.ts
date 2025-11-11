import { NextRequest, NextResponse } from "next/server";
import {
  createWorker,
  getWorkersByManagerId,
  updateWorker,
  deleteWorker,
} from "@/lib/workers";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workers = getWorkersByManagerId(parseInt(userId));
    return NextResponse.json(workers);
  } catch (error) {
    console.error("Error fetching workers:", error);
    return NextResponse.json(
      { error: "Failed to fetch workers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, name, phone, team } = await request.json();

    if (!code || !name) {
      return NextResponse.json(
        { error: "Code and name are required" },
        { status: 400 }
      );
    }

    const worker = createWorker(
      parseInt(userId),
      code,
      name,
      phone || null,
      team || null
    );

    return NextResponse.json(worker, { status: 201 });
  } catch (error) {
    console.error("Error creating worker:", error);
    if ((error as any).message?.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { error: "Worker code already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create worker" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, code, name, phone, team, active } = await request.json();

    if (!id || !code || !name) {
      return NextResponse.json(
        { error: "ID, code, and name are required" },
        { status: 400 }
      );
    }

    const worker = updateWorker(
      id,
      parseInt(userId),
      code,
      name,
      phone || null,
      team || null,
      active ? 1 : 0
    );

    return NextResponse.json(worker);
  } catch (error) {
    console.error("Error updating worker:", error);
    return NextResponse.json(
      { error: "Failed to update worker" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("id");

    if (!workerId) {
      return NextResponse.json(
        { error: "Worker ID is required" },
        { status: 400 }
      );
    }

    deleteWorker(parseInt(workerId), parseInt(userId));

    return NextResponse.json({ message: "Worker deleted successfully" });
  } catch (error) {
    console.error("Error deleting worker:", error);
    return NextResponse.json(
      { error: "Failed to delete worker" },
      { status: 500 }
    );
  }
}
