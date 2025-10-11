/**
 * Test file to demonstrate date/time combination functionality
 * This file can be run with: npx tsx src/lib/test-date-utils.ts
 */

import { combineDateAndTime, dateToTimestamp, formatDate } from './date-utils';

// Test cases
const testCases = [
  {
    date: "2025-10-22T00:00:00.000",
    time: "10:37",
    expected: "2025-10-22T10:37:00.000Z"
  },
  {
    date: "2025-12-31T00:00:00.000",
    time: "23:59",
    expected: "2025-12-31T23:59:00.000Z"
  },
  {
    date: "2025-01-01T00:00:00.000",
    time: "00:00",
    expected: "2025-01-01T00:00:00.000Z"
  }
];

console.log('🧪 Testing Date/Time Combination Utility\n');

testCases.forEach((testCase, index) => {
  console.log(`Test Case ${index + 1}:`);
  console.log(`  Input Date: ${testCase.date}`);
  console.log(`  Input Time: ${testCase.time}`);
  
  try {
    const combinedDate = combineDateAndTime(testCase.date, testCase.time);
    const timestamp = dateToTimestamp(combinedDate);
    const formatted = formatDate(combinedDate, 'long');
    
    console.log(`  ✅ Combined Date: ${timestamp}`);
    console.log(`  📅 Formatted: ${formatted}`);
    console.log(`  🎯 Expected: ${testCase.expected}`);
    
    // Check if the timestamp matches expected (allowing for timezone differences)
    const expectedDate = new Date(testCase.expected);
    const actualDate = new Date(timestamp);
    
    if (Math.abs(expectedDate.getTime() - actualDate.getTime()) < 1000) {
      console.log(`  ✅ PASS\n`);
    } else {
      console.log(`  ❌ FAIL - Time mismatch\n`);
    }
  } catch (error) {
    console.log(`  ❌ ERROR: ${error}\n`);
  }
});

console.log('🎉 Date/Time combination testing completed!');
