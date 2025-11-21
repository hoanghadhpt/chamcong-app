"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Palmtree, 
  AlertCircle, 
  Stethoscope, 
  Clock, 
  ChevronDown,
  Sun,
  CloudSun,
  LogOut
} from "lucide-react";
import AttendanceStatusChip from "./AttendanceStatusChip";
import { extractTimeFromTimestamp } from "@/lib/i18n";

export const STATUS_OPTIONS = [
  { key: "present", label: "Có mặt", icon: CheckCircle2, color: "bg-green-500", text: "text-green-700", bgLight: "bg-green-50" },
  { key: "absent", label: "Vắng", icon: XCircle, color: "bg-red-500", text: "text-red-700", bgLight: "bg-red-50" },
  { key: "leave_paid", label: "Phép CL", icon: Palmtree, color: "bg-blue-500", text: "text-blue-700", bgLight: "bg-blue-50" },
  { key: "leave_unpaid", label: "Phép KL", icon: AlertCircle, color: "bg-orange-500", text: "text-orange-700", bgLight: "bg-orange-50" },
  { key: "sick", label: "Ốm", icon: Stethoscope, color: "bg-purple-500", text: "text-purple-700", bgLight: "bg-purple-50" },
  { key: "ot", label: "Tăng ca", icon: Clock, color: "bg-yellow-500", text: "text-yellow-800", bgLight: "bg-yellow-50" },
];

interface StatusCellProps {
  status: string | null;
  workerId: number;
  shiftAmount: number;
  onStatusChange: (workerId: number, status: string, isCheckIn: boolean, shiftAmount: number) => void;
}

export function StatusCell({ status, workerId, shiftAmount, onStatusChange }: StatusCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (newStatus: string) => {
    onStatusChange(workerId, newStatus, false, shiftAmount);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 hover:bg-gray-100 rounded-lg p-1 transition-colors w-full justify-center group"
      >
        <AttendanceStatusChip status={status as any} size="sm" />
        <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
          <div className="p-1 grid grid-cols-1 gap-0.5">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => handleSelect(option.key)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${status === option.key ? "bg-primary-50 text-primary-700" : "text-text-secondary hover:bg-gray-50"}
                `}
              >
                <option.icon className={`w-4 h-4 ${status === option.key ? "text-primary-600" : "text-gray-400"}`} />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TimeCellProps {
  time: string | null;
  workerId: number;
  type: 'check_in' | 'check_out';
  status: string | null;
  onTimeChange?: (workerId: number, field: 'check_in' | 'check_out', time: string) => void;
  onMarkNow: () => void;
}

export function TimeCell({ time, workerId, type, status, onTimeChange, onMarkNow }: TimeCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTime, setTempTime] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const displayTime = extractTimeFromTimestamp(time);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsEditing(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStartEdit = () => {
    if (status !== 'present') return;
    setTempTime(displayTime || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onTimeChange && tempTime !== displayTime) {
      onTimeChange(workerId, type, tempTime);
    }
    setIsEditing(false);
  };

  if (status !== 'present' && type !== 'check_in') {
    return <span className="text-text-muted text-sm">---</span>;
  }

  if (isEditing) {
    return (
      <div ref={containerRef} className="absolute z-50 bg-white p-2 rounded-xl shadow-xl border border-gray-200 -m-2 min-w-[180px]">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-text-muted uppercase">
            {type === 'check_in' ? 'Giờ vào' : 'Giờ ra'}
          </label>
          <div className="flex gap-1">
            <input
              type="time"
              value={tempTime}
              onChange={(e) => setTempTime(e.target.value)}
              className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="px-2 py-1 bg-primary-500 text-white rounded-lg text-xs font-bold"
            >
              Lưu
            </button>
          </div>
          <button
            onClick={() => {
              onMarkNow();
              setIsEditing(false);
            }}
            className="w-full px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-text-secondary rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
          >
            <Clock className="w-3 h-3" />
            Hiện tại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group flex justify-center">
      {displayTime ? (
        <button
          onClick={handleStartEdit}
          className={`
            font-mono font-bold text-sm px-2 py-1 rounded transition-all border
            ${type === 'check_in' 
              ? "text-green-700 bg-green-50 border-green-100 hover:bg-green-100" 
              : "text-orange-700 bg-orange-50 border-orange-100 hover:bg-orange-100"
            }
          `}
        >
          {displayTime}
        </button>
      ) : (
        <button
          onClick={onMarkNow}
          className={`
            opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100
            flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border
            ${type === 'check_in'
              ? "bg-green-500 text-white border-green-600 shadow-sm"
              : "bg-orange-500 text-white border-orange-600 shadow-sm"
            }
          `}
        >
          {type === 'check_in' ? "Chấm vào" : "Chấm ra"}
        </button>
      )}
      
      {!displayTime && (
        <span className="absolute inset-0 flex items-center justify-center text-text-muted group-hover:opacity-0 transition-opacity">
          ---
        </span>
      )}
    </div>
  );
}

interface ShiftCellProps {
  shiftAmount: number;
  status: string | null;
  workerId: number;
  onStatusChange: (workerId: number, status: string, isCheckIn: boolean, shiftAmount: number) => void;
}

export function ShiftCell({ shiftAmount, status, workerId, onStatusChange }: ShiftCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (newAmount: number) => {
    if (status) {
      onStatusChange(workerId, status, false, newAmount);
    }
    setIsOpen(false);
  };

  if (!status) {
    return <span className="text-text-muted">---</span>;
  }

  return (
    <div className="relative flex justify-center" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="font-medium text-text-primary flex items-center justify-center gap-1 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
      >
        {shiftAmount === 0.5 ? (
          <CloudSun className="w-4 h-4 text-orange-400" />
        ) : (
          <Sun className="w-4 h-4 text-orange-500" />
        )}
        <span>{shiftAmount === 0.5 ? "0.5" : "1.0"}</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-1 w-32 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
          <div className="p-1 grid grid-cols-1 gap-0.5">
            <button
              onClick={() => handleSelect(1.0)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${shiftAmount === 1.0 ? "bg-primary-50 text-primary-700" : "text-text-secondary hover:bg-gray-50"}
              `}
            >
              <Sun className={`w-4 h-4 ${shiftAmount === 1.0 ? "text-primary-600" : "text-orange-500"}`} />
              Cả ngày (1.0)
            </button>
            <button
              onClick={() => handleSelect(0.5)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${shiftAmount === 0.5 ? "bg-primary-50 text-primary-700" : "text-text-secondary hover:bg-gray-50"}
              `}
            >
              <CloudSun className={`w-4 h-4 ${shiftAmount === 0.5 ? "text-primary-600" : "text-orange-400"}`} />
              Nửa ngày (0.5)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
