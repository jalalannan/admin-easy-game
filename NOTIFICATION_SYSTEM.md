# Notification Management System

This document describes the notification management system implemented for the admin panel, based on the `notification_template.json` structure.

## Overview

The notification management system provides full CRUD operations for managing notification templates used in the application. It supports filtering by user type (STUDENT/TUTOR), notification type, request type, and includes search functionality.

## Features

### ✅ Completed Features

1. **Type Definitions** (`src/types/notification.ts`)
   - Complete TypeScript types for notifications
   - User type, notification type, and request type enums
   - Filter interfaces and response types
   - Display labels for all enum values

2. **State Management** (`src/stores/notification-management-store.ts`)
   - Zustand store for notification management
   - CRUD operations (Create, Read, Update, Delete)
   - Filtering and search functionality
   - Pagination support
   - Error handling and loading states

3. **API Routes**
   - `GET /api/notifications` - Fetch notifications with filters and pagination
   - `POST /api/notifications` - Create new notification
   - `GET /api/notifications/[id]` - Get specific notification
   - `PUT /api/notifications/[id]` - Update notification
   - `DELETE /api/notifications/[id]` - Delete notification

4. **UI Components**
   - Notification management page (`src/app/dashboard/notifications/page.tsx`)
   - Data table with sorting and pagination
   - Advanced filtering (user type, notification type, request type)
   - Search functionality
   - Create/Edit dialog forms
   - Responsive design

5. **Navigation Integration**
   - Added notifications link to sidebar
   - Proper permission-based access control

6. **Data Import Script** (`scripts/import-notifications.js`)
   - Import notification templates from JSON to Firebase
   - Batch processing for efficiency
   - Verification and statistics

## Data Structure

### Notification Object
```typescript
interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  userType: UserType;
  requestType: RequestType;
  createdAt: string;
  updatedAt: string;
}
```

### User Types
- `STUDENT` - Notifications for students
- `TUTOR` - Notifications for tutors

### Notification Types
- `STUDENTCREATEREQUEST` - Student creates a request
- `TUTORBIDREQUEST` - Tutor bids on a request
- `STUDENTREJECTBID` - Student rejects a bid
- `TUTORUPDATEBID` - Tutor updates their bid
- `STUDENTACCEPTBID` - Student accepts a bid
- `STUDENTPAYREQUEST` - Student pays for request
- `TUTORCOMPLETEREQUEST` - Tutor completes request
- `STUDENTREJECTCOMPLETE` - Student rejects completion
- `STUDENTACCEPTCOMPLETE` - Student accepts completion
- `STUDENTCANCELREQUEST` - Student cancels request

### Request Types
- `ALL` - All request types
- `EXAM` - Exam requests
- `SOS` - Rapid Q&A requests
- `ONLINE` - Online session requests

## Usage

### 1. Import Initial Data
```bash
cd scripts
node import-notifications.js
```

### 2. Access the Interface
Navigate to `/dashboard/notifications` in the admin panel.

### 3. Filter Notifications
- **User Type**: Filter by STUDENT or TUTOR
- **Notification Type**: Filter by specific notification types
- **Request Type**: Filter by request types (ALL, EXAM, SOS, ONLINE)
- **Search**: Text search across title and body fields

### 4. Manage Notifications
- **Create**: Click "Add Notification" button
- **Edit**: Click edit icon on any notification row
- **Delete**: Click delete icon (with confirmation)
- **View**: All notifications displayed in a sortable table

## API Endpoints

### GET /api/notifications
Fetch notifications with optional filters and pagination.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `userType` - Filter by user type (STUDENT/TUTOR)
- `type` - Filter by notification type
- `requestType` - Filter by request type
- `search` - Text search in title/body
- `startDate` - Filter by creation date (ISO string)
- `endDate` - Filter by creation date (ISO string)

**Response:**
```typescript
{
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
}
```

### POST /api/notifications
Create a new notification.

**Request Body:**
```typescript
{
  title: string;
  body: string;
  type: NotificationType;
  userType: UserType;
  requestType: RequestType;
}
```

### PUT /api/notifications/[id]
Update an existing notification.

**Request Body:**
```typescript
{
  title?: string;
  body?: string;
  type?: NotificationType;
  userType?: UserType;
  requestType?: RequestType;
}
```

### DELETE /api/notifications/[id]
Delete a notification.

## Firebase Collection Structure

```
notifications/
├── {docId}/
│   ├── title: string
│   ├── body: string
│   ├── type: string
│   ├── userType: string
│   ├── requestType: string
│   ├── createdAt: string (ISO)
│   └── updatedAt: string (ISO)
```

## Permissions

The notification management system respects the existing permission system:
- Resource: `notifications`
- Actions: `read`, `create`, `update`, `delete`

Users need appropriate permissions to access the notifications page and perform CRUD operations.

## Error Handling

- API routes include comprehensive error handling
- Store includes error state management
- UI displays error messages to users
- Validation for required fields

## Future Enhancements

Potential improvements for the notification system:
1. Bulk operations (bulk delete, bulk update)
2. Notification scheduling
3. Template variables/substitution
4. Notification preview functionality
5. Export/import functionality
6. Notification analytics and usage tracking
