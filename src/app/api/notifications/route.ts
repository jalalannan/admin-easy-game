import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/firebase-edge';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit, 
  getDocs, 
  addDoc,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { 
  CreateNotificationRequest, 
  NotificationFilters, 
  NotificationListResponse,
  Notification 
} from '@/types/notification';

export const runtime = 'edge';

const COLLECTION_NAME = 'notifications';

// GET /api/notifications - Fetch notifications with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userType = searchParams.get('userType') as 'STUDENT' | 'TUTOR' | null;
    const type = searchParams.get('type') as string | null;
    const requestType = searchParams.get('requestType') as string | null;
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // Build Firestore query
    const constraints: QueryConstraint[] = [];

    // Apply filters
    if (userType) {
      constraints.push(where('userType', '==', userType));
    }
    
    if (type) {
      constraints.push(where('type', '==', type));
    }
    
    if (requestType) {
      constraints.push(where('requestType', '==', requestType));
    }

    // Date range filter
    if (startDate) {
      constraints.push(where('createdAt', '>=', new Date(startDate)));
    }
    
    if (endDate) {
      constraints.push(where('createdAt', '<=', new Date(endDate)));
    }

    // Order by creation date (newest first)
    constraints.push(orderBy('createdAt', 'desc'));

    // Create query
    const notificationsQuery = query(
      collection(db, COLLECTION_NAME),
      ...constraints
    );

    // Execute query
    const snapshot = await getDocs(notificationsQuery);
    
    let notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];

    // Get total count
    const total = notifications.length;

    // Apply text search filter (client-side for simplicity)
    if (search) {
      const searchLower = search.toLowerCase();
      notifications = notifications.filter(notification =>
        notification.title.toLowerCase().includes(searchLower) ||
        notification.body.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination (client-side)
    const offset = (page - 1) * limit;
    const paginatedNotifications = notifications.slice(offset, offset + limit);

    const response: NotificationListResponse = {
      notifications: paginatedNotifications,
      total,
      page,
      limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const data: CreateNotificationRequest = await request.json();

    // Validate required fields
    if (!data.title || !data.body || !data.type || !data.userType || !data.requestType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create notification document
    const now = new Date().toISOString();
    const notificationData = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), notificationData);
    
    const notification: Notification = {
      id: docRef.id,
      ...notificationData,
    };

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
