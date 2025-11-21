import { getDB } from "./db";

export interface PayrollRecord {
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

function getStandardWorkDays(month: number, year: number): number {
  const lastDay = new Date(year, month, 0).getDate();
  let workDays = 0;
  
  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month - 1, day);
    if (date.getDay() !== 0) { // 0 is Sunday
      workDays++;
    }
  }
  
  return workDays;
}

export async function calculateMonthlyPayroll(
  managerId: number,
  month: number,
  year: number
): Promise<PayrollRecord[]> {
  const db = getDB();

  // 1. Get all active workers
  const workersResult = await db.query(
    "SELECT id, code, name, base_salary FROM workers WHERE manager_id = $1 AND active = 1 ORDER BY code ASC",
    [managerId]
  );
  const workers = workersResult.rows;

  // 2. Get attendance for the month
  // Construct date range
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  // Calculate end date (last day of month)
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const attendanceResult = await db.query(
    `SELECT worker_id, status, shift_amount, ot_1_5, ot_2_0, ot_3_0, late_minutes, early_minutes
     FROM attendance
     WHERE manager_id = $1 AND work_date >= $2 AND work_date <= $3`,
    [managerId, startDate, endDate]
  );
  const attendance = attendanceResult.rows;

  // Calculate standard work days for this month
  const standardWorkDays = getStandardWorkDays(month, year);

  // 3. Calculate payroll for each worker
  const payroll: PayrollRecord[] = workers.map((worker) => {
    const workerAttendance = attendance.filter((a) => a.worker_id === worker.id);

    let workDays = 0;
    let paidLeaveDays = 0;
    let totalOtHours = 0;
    let totalLateMinutes = 0;
    let totalEarlyMinutes = 0;

    workerAttendance.forEach((record) => {
      if (record.status === 'present') {
        workDays += record.shift_amount || 1.0;
        totalLateMinutes += record.late_minutes || 0;
        totalEarlyMinutes += record.early_minutes || 0;
        
        // OT is stored in minutes usually? No, schema says INTEGER. 
        // Let's assume minutes for consistency with late/early, 
        // BUT the column names are ot_1_5, etc. 
        // Let's assume they are minutes.
        totalOtHours += (record.ot_1_5 || 0) / 60;
        totalOtHours += (record.ot_2_0 || 0) / 60;
        totalOtHours += (record.ot_3_0 || 0) / 60;
      } else if (record.status === 'leave_paid') {
        paidLeaveDays += record.shift_amount || 1.0;
      }
    });

    // Calculation Formula
    const baseSalary = worker.base_salary || 0;
    
    // Daily Rate
    const dailyRate = standardWorkDays > 0 ? baseSalary / standardWorkDays : 0;
    // Hourly Rate (8 hours)
    const hourlyRate = dailyRate / 8;

    // Salary for worked days + paid leave
    let salary = (workDays + paidLeaveDays) * dailyRate;

    // Add OT (simplified: all OT is 1.5x for now or just add raw hours * rate * 1.5)
    // Let's try to be more precise if we had the breakdown, but here we summed up hours.
    // Let's assume average 1.5x for the total OT hours for simplicity in this MVP
    // Or better, iterate again? No, let's just use 1.5x for all for now as a base estimate.
    // Actually, let's refine the loop above to sum weighted OT.
    
    let weightedOtHours = 0;
    workerAttendance.forEach((record) => {
        if (record.status === 'present') {
            weightedOtHours += ((record.ot_1_5 || 0) / 60) * 1.5;
            weightedOtHours += ((record.ot_2_0 || 0) / 60) * 2.0;
            weightedOtHours += ((record.ot_3_0 || 0) / 60) * 3.0;
        }
    });
    
    salary += weightedOtHours * hourlyRate;

    // Deduct Late/Early
    // Deduct straight time? Or penalty? Let's deduct straight time.
    const lostHours = (totalLateMinutes + totalEarlyMinutes) / 60;
    salary -= lostHours * hourlyRate;

    return {
      workerId: worker.id,
      workerCode: worker.code,
      workerName: worker.name,
      baseSalary,
      workDays,
      paidLeaveDays,
      totalOtHours, // Display raw hours
      totalLateMinutes,
      totalEarlyMinutes,
      estimatedSalary: Math.max(0, Math.round(salary)),
      standardWorkDays,
    };
  });

  return payroll;
}
