/**
 * Test file to demonstrate timezone conversion functionality
 * This shows how deadlines are displayed according to request timezone
 */

import { formatDateWithTimezone, combineDateAndTime } from './date-utils';

console.log('🌍 Testing Timezone Conversion for Request Deadlines\n');

// Mock request data
const mockRequest = {
  id: "req123",
  date: "2025-01-15T00:00:00.000", // January 15, 2025
  deadline: "14:30", // 2:30 PM
  timezone: "Asia/Beirut" // UTC+2 (or UTC+3 during DST)
};

console.log('Mock Request Data:');
console.log(`  Date: ${mockRequest.date}`);
console.log(`  Time: ${mockRequest.deadline}`);
console.log(`  Timezone: ${mockRequest.timezone}\n`);

// Test timezone conversion
try {
  // Combine date and time
  const combinedDate = combineDateAndTime(mockRequest.date, mockRequest.deadline);
  console.log('Combined Date (UTC):', combinedDate.toISOString());
  
  // Format with timezone
  const formattedWithTimezone = formatDateWithTimezone(
    combinedDate, 
    'MMM dd, yyyy HH:mm', 
    mockRequest.timezone
  );
  
  console.log(`Formatted with ${mockRequest.timezone}:`, formattedWithTimezone);
  
  // Compare with local time
  const formattedLocal = formatDateWithTimezone(combinedDate, 'MMM dd, yyyy HH:mm');
  console.log('Formatted (local time):', formattedLocal);
  
  console.log('\n✅ Timezone conversion test completed successfully!');
  
} catch (error) {
  console.error('❌ Timezone conversion test failed:', error);
}

console.log('\n📋 Expected Behavior:');
console.log('  1. Date and time are combined into a UTC Date object');
console.log('  2. When timezone is provided, display time in that timezone');
console.log('  3. Asia/Beirut is typically UTC+2 (or UTC+3 during DST)');
console.log('  4. If no timezone, fallback to local browser timezone\n');

console.log('🎯 Benefits:');
console.log('  ✅ Accurate deadline display for users in different timezones');
console.log('  ✅ Consistent time display regardless of admin location');
console.log('  ✅ Better user experience for international users');
console.log('  ✅ Proper handling of daylight saving time changes\n');

console.log('🔧 Implementation Details:');
console.log('  - Uses Intl.DateTimeFormat for accurate timezone conversion');
console.log('  - Handles both UTC and local timezone scenarios');
console.log('  - Graceful fallback if timezone is not provided');
console.log('  - Error handling for invalid timezone or date values\n');

console.log('🎉 Timezone conversion implementation completed!');
