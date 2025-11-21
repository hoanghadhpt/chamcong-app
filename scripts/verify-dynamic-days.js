// Verification script for dynamic standard work days logic
// Run with: node scripts/verify-dynamic-days.js

function getStandardWorkDays(month, year) {
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

const tests = [
  {
    name: "February 2024 (Leap Year)",
    month: 2,
    year: 2024,
    expected: 25 // 29 days - 4 Sundays (4, 11, 18, 25)
  },
  {
    name: "February 2025 (Non-Leap Year)",
    month: 2,
    year: 2025,
    expected: 24 // 28 days - 4 Sundays (2, 9, 16, 23)
  },
  {
    name: "November 2025",
    month: 11,
    year: 2025,
    expected: 25 // 30 days - 5 Sundays (2, 9, 16, 23, 30)
  },
  {
    name: "December 2025",
    month: 12,
    year: 2025,
    expected: 27 // 31 days - 4 Sundays (7, 14, 21, 28)
  }
];

let passed = 0;
let failed = 0;

console.log("Running tests...");
tests.forEach(test => {
  const result = getStandardWorkDays(test.month, test.year);
  
  if (result === test.expected) {
    console.log(`[PASS] ${test.name}: Expected ${test.expected}, Got ${result}`);
    passed++;
  } else {
    console.log(`[FAIL] ${test.name}: Expected ${test.expected}, Got ${result}`);
    failed++;
  }
});

console.log(`\nTotal: ${tests.length}, Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
