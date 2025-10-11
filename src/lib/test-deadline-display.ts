/**
 * Test file to demonstrate deadline display functionality
 * This shows how request.deadline is combined with request.date
 */

import { combineDateAndTime } from './date-utils';
import { format } from 'date-fns';

// Mock request data
const mockRequest = {
  id: '1',
  date: '2025-10-22T00:00:00.000',
  time: '10:37',
  deadline: '2025-10-22T10:37:00.000Z', // This should be ignored when we have date + time
  label: 'Test Request',
  subject: 'Mathematics',
  language: 'English',
  country: 'USA',
  student_price: '100',
  tutor_price: '80',
  request_status: 'NEW',
  assistance_type: 'exam',
  created_at: '2025-10-21T08:00:00.000Z',
  updated_at: '2025-10-21T08:00:00.000Z'
};

// Function to format deadline (same as in the component)
const formatDeadline = (request: any) => {
  try {
    // If we have both date and time, combine them
    if (request.date && request.time) {
      const combinedDate = combineDateAndTime(request.date, request.time);
      return format(combinedDate, 'MMM dd, yyyy HH:mm');
    }
    
    // If we have a deadline timestamp, use it
    if (request.deadline) {
      let date: Date;
      if (request.deadline.toDate && typeof request.deadline.toDate === 'function') {
        date = request.deadline.toDate();
      } else if (typeof request.deadline === 'string' || typeof request.deadline === 'number') {
        date = new Date(request.deadline);
      } else {
        return 'Not set';
      }
      
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return format(date, 'MMM dd, yyyy HH:mm');
    }
    
    return 'Not set';
  } catch (error) {
    console.error('Error formatting deadline:', error);
    return 'Invalid date';
  }
};

console.log('🧪 Testing Deadline Display Functionality\n');

console.log('Mock Request Data:');
console.log(`  Date: ${mockRequest.date}`);
console.log(`  Time: ${mockRequest.time}`);
console.log(`  Deadline: ${mockRequest.deadline}\n`);

console.log('Formatted Deadline:');
const formattedDeadline = formatDeadline(mockRequest);
console.log(`  Result: ${formattedDeadline}\n`);

console.log('Expected Behavior:');
console.log('  ✅ Should combine date + time when both are available');
console.log('  ✅ Should ignore the deadline field when date + time exist');
console.log('  ✅ Should format as "Oct 22, 2025 10:37"\n');

console.log('🎉 Deadline display test completed!');
