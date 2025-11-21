// Verification script for attendance calculation logic
// Run with: node scripts/verify-calculation.js

function calculateAttendanceMetrics(checkIn, checkOut, shift) {
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

  let adjustedCheckInMins = checkInTotalMins;
  if (shift.is_overnight && checkInTotalMins < shiftStartMins - 180) { 
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

    if (shift.is_overnight && checkOutTotalMins < shiftStartMins - 180) {
       checkOutTotalMins += 24 * 60;
    }
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

// Test Cases
const shiftRegular = {
  start_time: "08:00",
  end_time: "17:00",
  is_overnight: 0
};

const shiftOvernight = {
  start_time: "22:00",
  end_time: "06:00",
  is_overnight: 1
};

const tests = [
  {
    name: "Regular - On Time",
    shift: shiftRegular,
    checkIn: "2023-11-20 08:00:00",
    checkOut: "2023-11-20 17:00:00",
    expected: { lateMinutes: 0, earlyMinutes: 0, otMinutes: 0 }
  },
  {
    name: "Regular - Late 10m",
    shift: shiftRegular,
    checkIn: "2023-11-20 08:10:00",
    checkOut: "2023-11-20 17:00:00",
    expected: { lateMinutes: 10, earlyMinutes: 0, otMinutes: 0 }
  },
  {
    name: "Regular - Early 10m",
    shift: shiftRegular,
    checkIn: "2023-11-20 08:00:00",
    checkOut: "2023-11-20 16:50:00",
    expected: { lateMinutes: 0, earlyMinutes: 10, otMinutes: 0 }
  },
  {
    name: "Regular - OT 30m",
    shift: shiftRegular,
    checkIn: "2023-11-20 08:00:00",
    checkOut: "2023-11-20 17:30:00",
    expected: { lateMinutes: 0, earlyMinutes: 0, otMinutes: 30 }
  },
  {
    name: "Overnight - On Time",
    shift: shiftOvernight,
    checkIn: "2023-11-20 22:00:00",
    checkOut: "2023-11-21 06:00:00",
    expected: { lateMinutes: 0, earlyMinutes: 0, otMinutes: 0 }
  },
  {
    name: "Overnight - Late 15m (Next Day Checkin? No, same day late)",
    shift: shiftOvernight,
    checkIn: "2023-11-20 22:15:00",
    checkOut: "2023-11-21 06:00:00",
    expected: { lateMinutes: 15, earlyMinutes: 0, otMinutes: 0 }
  },
  {
    name: "Overnight - Late Checkin After Midnight (01:00)",
    shift: shiftOvernight,
    checkIn: "2023-11-21 01:00:00", // 3 hours late
    checkOut: "2023-11-21 06:00:00",
    expected: { lateMinutes: 180, earlyMinutes: 0, otMinutes: 0 }
  }
];

let passed = 0;
let failed = 0;

console.log("Running tests...");
tests.forEach(test => {
  const result = calculateAttendanceMetrics(test.checkIn, test.checkOut, test.shift);
  const isLateCorrect = result.lateMinutes === test.expected.lateMinutes;
  const isEarlyCorrect = result.earlyMinutes === test.expected.earlyMinutes;
  const isOtCorrect = result.otMinutes === test.expected.otMinutes;

  if (isLateCorrect && isEarlyCorrect && isOtCorrect) {
    console.log(`[PASS] ${test.name}`);
    passed++;
  } else {
    console.log(`[FAIL] ${test.name}`);
    console.log(`  Expected:`, test.expected);
    console.log(`  Got:`, result);
    failed++;
  }
});

console.log(`\nTotal: ${tests.length}, Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
