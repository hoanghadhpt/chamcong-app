"use client";

import { useState } from "react";
import WorkerRow from "./WorkerRow";

interface Worker {
  id: number;
  code: string;
  name: string;
  team: string | null;
  active: number;
}

interface AttendanceRecord {
  id: number;
  worker_id: number;
  work_date: string;
  status: string | null;
  check_in: string | null;
  check_out: string | null;
  shift_amount?: number;
}

interface TeamSectionProps {
  teamName: string;
  workers: Worker[];
  attendance: Map<number, AttendanceRecord>;
  changes: Map<number, AttendanceRecord>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (workerId: number, status: string, isCheckIn: boolean, shiftAmount: number) => void;
  onCheckOut: (workerId: number) => void;
  onBatchMark: (teamName: string, status: string) => void;
  batchMarking: string | null;
  className?: string;
}

const BATCH_STATUS_OPTIONS = [
  { key: "present", label: "Có mặt", color: "bg-green-600 hover:bg-green-700" },
  { key: "absent", label: "Vắng", color: "bg-red-600 hover:bg-red-700" },
  { key: "leave_paid", label: "Phép", color: "bg-accent hover:bg-accent-light" },
];

export default function TeamSection({
  teamName,
  workers,
  attendance,
  changes,
  isExpanded,
  onToggleExpand,
  onStatusChange,
  onCheckOut,
  onBatchMark,
  batchMarking,
  className = "",
}: TeamSectionProps) {
  const presentCount = workers.filter((w) => {
    const current = changes.get(w.id) || attendance.get(w.id);
    return current?.status === "present";
  }).length;

  const isMarking = batchMarking === teamName;

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden ${className}`}>
      {/* Team Header */}
      <div className="bg-gradient-to-r from-primary to-accent text-white p-4">
        {/* Team Name & Toggle */}
        <button
          onClick={onToggleExpand}
          className="w-full text-left hover:opacity-90 transition-opacity mb-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">{isExpanded ? "▼" : "▶"}</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold">{teamName}</h3>
              <p className="text-sm text-beige-100 mt-0.5">
                {presentCount}/{workers.length} Có mặt
              </p>
            </div>
          </div>
        </button>

        {/* Batch Mark Buttons - Mobile Optimized */}
        <div className="grid grid-cols-3 gap-2">
          {BATCH_STATUS_OPTIONS.map((option) => (
            <button
              key={`batch-${option.key}`}
              onClick={() => onBatchMark(teamName, option.key)}
              disabled={isMarking}
              className={`px-3 py-2.5 ${option.color} text-white font-bold rounded-lg transition-all text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95`}
            >
              {isMarking ? "⏳" : option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Team Workers - shown only when expanded */}
      {isExpanded && (
        <div className="space-y-3 p-4 bg-gray-50">
          {workers.map((worker) => {
            const current = changes.get(worker.id) || attendance.get(worker.id);
            return (
              <WorkerRow
                key={worker.id}
                worker={worker}
                attendance={current}
                onStatusChange={onStatusChange}
                onCheckOut={onCheckOut}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
