import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';
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

    // Build Firestore query (type as Query to allow where/orderBy chaining)
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData> = adminDb.collection(COLLECTION_NAME);

    // Apply filters
    if (userType) {
      query = query.where('userType', '==', userType);
    }
    
    if (type) {
      query = query.where('type', '==', type);
    }
    
    if (requestType) {
      query = query.where('requestType', '==', requestType);
    }

    // Date range filter
    if (startDate) {
      query = query.where('createdAt', '>=', new Date(startDate));
    }
    
    if (endDate) {
      query = query.where('createdAt', '<=', new Date(endDate));
    }

    // Order by creation date (newest first)
    query = query.orderBy('createdAt', 'desc');

    // Get total count for pagination
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);

    // Execute query
    const snapshot = await query.get();
    
    let notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];

    // Apply text search filter (client-side for simplicity)
    if (search) {
      const searchLower = search.toLowerCase();
      notifications = notifications.filter(notification =>
        notification.title.toLowerCase().includes(searchLower) ||
        notification.body.toLowerCase().includes(searchLower)
      );
    }

    const response: NotificationListResponse = {
      notifications,
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

    const docRef = await adminDb.collection(COLLECTION_NAME).add(notificationData);
    
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
