import { openDB } from "idb";

const DB_NAME = "chamcong-app";
const STORE_NAME = "offlineQueue";

interface QueueItem {
  id?: number;
  workerId: number;
  workDate: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  shiftAmount?: number;
  timestamp: number;
}

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    },
  });
}

export async function addToQueue(item: Omit<QueueItem, "id" | "timestamp">) {
  const db = await getDB();
  return db.add(STORE_NAME, {
    ...item,
    timestamp: Date.now(),
  });
}

export async function getOfflineQueue(): Promise<QueueItem[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function removeFromQueue(workerId: number) {
  const db = await getDB();
  const allItems = await db.getAll(STORE_NAME);
  const items = allItems.filter((item) => item.workerId === workerId);

  for (const item of items) {
    if (item.id) {
      await db.delete(STORE_NAME, item.id);
    }
  }
}

export async function clearQueue() {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

export async function syncQueue() {
  const queue = await getOfflineQueue();
  const succeeded: number[] = [];
  const failed: QueueItem[] = [];

  for (const item of queue) {
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: item.workerId,
          workDate: item.workDate,
          status: item.status,
          checkIn: item.checkIn,
          checkOut: item.checkOut,
          shiftAmount: item.shiftAmount || 1.0,
        }),
      });

      if (response.ok) {
        if (item.id) succeeded.push(item.id);
      } else {
        failed.push(item);
      }
    } catch (error) {
      console.error("Error syncing queue item:", error);
      failed.push(item);
    }
  }

  // Remove succeeded items
  const db = await getDB();
  for (const id of succeeded) {
    await db.delete(STORE_NAME, id);
  }

  return { succeeded: succeeded.length, failed: failed.length };
}
