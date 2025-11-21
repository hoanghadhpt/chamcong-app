import { Shift } from "./shifts";

interface AttendanceMetrics {
  lateMinutes: number;
  earlyMinutes: number;
  otMinutes: number;
}

export function calculateAttendanceMetrics(
  checkIn: string | null,
  checkOut: string | null,
  shift: Shift
): AttendanceMetrics {
  let lateMinutes = 0;
  let earlyMinutes = 0;
  let otMinutes = 0;

  if (!checkIn) {
    return { lateMinutes, earlyMinutes, otMinutes };
  }

  // Parse Shift Times
  const [shiftStartH, shiftStartM] = shift.start_time.split(":").map(Number);
  const shiftStartMins = shiftStartH * 60 + shiftStartM;

  const [shiftEndH, shiftEndM] = shift.end_time.split(":").map(Number);
  let shiftEndMins = shiftEndH * 60 + shiftEndM;

  if (shift.is_overnight && shiftEndMins < shiftStartMins) {
    shiftEndMins += 24 * 60;
  }

  // Parse Check In
  const checkInDate = new Date(checkIn);
  const checkInH = checkInDate.getHours();
  const checkInM = checkInDate.getMinutes();
  const checkInTotalMins = checkInH * 60 + checkInM;

  // Calculate Late
  // If overnight and checkIn is very early (e.g. 1 AM) but shift starts at 22:00,
  // we need to handle the day wrap.
  // However, the system stores full timestamps, so we can compare directly if we align the dates.
  // But here we are comparing times.
  // Let's simplify: Assume check-in is on the same "shift day".
  
  // Adjust checkInTotalMins for overnight if needed
  // If shift is overnight (e.g. 22:00 - 06:00)
  // Check in at 22:10 -> 22*60+10
  // Check in at 00:10 -> 24*60+10
  
  let adjustedCheckInMins = checkInTotalMins;
  if (shift.is_overnight && checkInTotalMins < shiftStartMins - 180) { 
      // Heuristic: if check-in is way earlier than start (e.g. 3 hours), it might be next day?
      // Actually, for overnight, if check-in is 01:00, it is likely "late" relative to 22:00 start.
      // So we add 24h.
      adjustedCheckInMins += 24 * 60;
  }

  if (adjustedCheckInMins > shiftStartMins) {
    lateMinutes = adjustedCheckInMins - shiftStartMins;
  }

  // Calculate Early & OT
  if (checkOut) {
    const checkOutDate = new Date(checkOut);
    const checkOutH = checkOutDate.getHours();
    const checkOutM = checkOutDate.getMinutes();
    let checkOutTotalMins = checkOutH * 60 + checkOutM;

    // Adjust for overnight
    if (shift.is_overnight && checkOutTotalMins < shiftStartMins - 180) {
       checkOutTotalMins += 24 * 60;
    }
    // Also if checkOut < checkIn (crossing midnight but not caught by above), add 24h
    if (checkOutTotalMins < adjustedCheckInMins) {
        checkOutTotalMins += 24 * 60;
    }

    if (checkOutTotalMins < shiftEndMins) {
      earlyMinutes = shiftEndMins - checkOutTotalMins;
    } else if (checkOutTotalMins > shiftEndMins) {
      otMinutes = checkOutTotalMins - shiftEndMins;
    }
  }

  return {
    lateMinutes: Math.max(0, lateMinutes),
    earlyMinutes: Math.max(0, earlyMinutes),
    otMinutes: Math.max(0, otMinutes),
  };
}
