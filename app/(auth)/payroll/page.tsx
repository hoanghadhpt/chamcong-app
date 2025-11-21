"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/i18n";
import { Calendar, DollarSign, Download } from "lucide-react";

interface PayrollRecord {
  workerId: number;
  workerCode: string;
  workerName: string;
  baseSalary: number;
  workDays: number;
  paidLeaveDays: number;
  totalOtHours: number;
  totalLateMinutes: number;
  totalEarlyMinutes: number;
  estimatedSalary: number;
  standardWorkDays: number;
}

export default function PayrollPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPayroll();
  }, [month, year]);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll?month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setPayroll(data);
      }
    } catch (error) {
      console.error("Error fetching payroll:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalSalary = payroll.reduce((sum, record) => sum + record.estimatedSalary, 0);

  return (
    <div className="min-h-screen bg-background pb-32 lg:pb-12">
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-primary-600" />
              Bảng Lương Ước Tính
            </h1>
            <p className="text-text-secondary mt-1">
              Tự động tính toán dựa trên chấm công và lương cơ bản
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
            <Calendar className="w-5 h-5 text-text-muted ml-2" />
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="bg-transparent font-semibold text-text-primary border-none focus:ring-0 cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
            <span className="text-gray-300">|</span>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-transparent font-semibold text-text-primary border-none focus:ring-0 cursor-pointer"
            >
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-lg shadow-primary-500/20">
            <p className="text-primary-100 text-sm font-medium mb-1">Tổng lương ước tính</p>
            <p className="text-3xl font-bold">{formatCurrency(totalSalary)}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
            <p className="text-text-secondary text-sm font-medium mb-1">Tổng nhân viên</p>
            <p className="text-3xl font-bold text-text-primary">{payroll.length}</p>
          </div>
           <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
            <p className="text-text-secondary text-sm font-medium mb-1">Công chuẩn tháng</p>
            <p className="text-3xl font-bold text-text-primary">
              {payroll.length > 0 ? payroll[0].standardWorkDays : "---"}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Nhân viên</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-text-muted uppercase tracking-wider">Lương CB</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Công</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-text-muted uppercase tracking-wider">OT (h)</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Trễ/Sớm (p)</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-text-muted uppercase tracking-wider">Thực lĩnh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                      Đang tính toán...
                    </td>
                  </tr>
                ) : payroll.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                      Không có dữ liệu lương cho tháng này
                    </td>
                  </tr>
                ) : (
                  payroll.map((record) => (
                    <tr key={record.workerId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-text-primary">{record.workerName}</p>
                          <p className="text-xs text-text-secondary">{record.workerCode}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-text-secondary">
                        {formatCurrency(record.baseSalary)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {record.workDays + record.paidLeaveDays}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-text-secondary">
                        {record.totalOtHours.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-text-secondary">
                        {record.totalLateMinutes + record.totalEarlyMinutes}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-green-600">
                        {formatCurrency(record.estimatedSalary)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
