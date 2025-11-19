"use client";

import { useState } from "react";
import WorkerRow from "./WorkerRow";
import { ChevronRight, Users } from "lucide-react";

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
  onTimeChange?: (workerId: number, field: 'check_in' | 'check_out', time: string) => void;
  onBatchMark: (teamName: string, status: string) => void;
  batchMarking: string | null;
  className?: string;
}

const BATCH_STATUS_OPTIONS = [
  { key: "present", label: "Có mặt", color: "bg-success hover:bg-success/90" },
  { key: "absent", label: "Vắng", color: "bg-error hover:bg-error/90" },
  { key: "leave_paid", label: "Phép", color: "bg-primary-400 hover:bg-primary-500" },
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
  onTimeChange,
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
    <div className={`bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-100 ${className}`}>
      {/* Team Header */}
      <div className={`p-4 transition-all duration-300 ${
        isExpanded
          ? "bg-primary-50 border-b border-primary-100"
          : "bg-white hover:bg-gray-50"
      }`}>
        {/* Team Name & Toggle */}
        <button
          onClick={onToggleExpand}
          className="w-full text-left group mb-4"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-all duration-300 ${
              isExpanded ? "bg-primary-500 text-white rotate-90" : "bg-gray-100 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-600"
            }`}>
              <ChevronRight className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold transition-colors ${
                isExpanded ? "text-primary-900" : "text-text-primary"
              }`}>
                {teamName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-text-muted mt-0.5">
                <Users className="w-4 h-4" />
                <span>{presentCount}/{workers.length} Có mặt</span>
              </div>
            </div>
          </div>
        </button>

        {/* Batch Mark Buttons */}
        <div className={`grid grid-cols-3 gap-3 transition-all duration-300 ${
          isExpanded ? "opacity-100 translate-y-0" : "opacity-50"
        }`}>
          {BATCH_STATUS_OPTIONS.map((option) => (
            <button
              key={`batch-${option.key}`}
              onClick={(e) => {
                e.stopPropagation();
                onBatchMark(teamName, option.key);
              }}
              disabled={isMarking}
              className={`px-3 py-2.5 ${option.color} text-white font-bold rounded-xl transition-all text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95 min-h-[44px] flex items-center justify-center gap-2`}
            >
              {isMarking ? <span className="animate-spin">⏳</span> : option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Team Workers - Animated Expand */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
            <div className="space-y-4 p-4 bg-surface-highlight/30">
            {workers.map((worker) => {
                const current = changes.get(worker.id) || attendance.get(worker.id);
                return (
                <WorkerRow
                    key={worker.id}
                    worker={worker}
                    attendance={current}
                    onStatusChange={onStatusChange}
                    onCheckOut={onCheckOut}
                    onTimeChange={onTimeChange}
                />
                );
            })}
            </div>
        </div>
      </div>
    </div>
  );
}
