import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';

const COLLECTION_NAME = 'admin_notifications';

// GET /api/admin-notifications - Fetch admin notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '50');
    const seen = searchParams.get('seen');

    // Build Firestore query
    let query = adminDb.collection(COLLECTION_NAME);

    // Apply filters
    if (seen !== null) {
      query = query.where('seen', '==', seen === 'true');
    }

    // Order by creation date (newest first)
    query = query.orderBy('createdAt', 'desc').limit(limit);

    // Execute query
    const snapshot = await query.get();
    
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin notifications' },
      { status: 500 }
    );
  }
}

// POST /api/admin-notifications - Create a new admin notification
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.type || !data.requestId || !data.senderType || !data.senderId || !data.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create notification document
    const notificationData = {
      type: data.type,
      requestId: data.requestId,
      chatId: data.chatId || '',
      senderType: data.senderType,
      senderId: data.senderId,
      senderName: data.senderName || '',
      senderNickname: data.senderNickname || '',
      message: data.message,
      content: data.content || `${data.senderNickname || data.senderName} sent a message: "${data.message}"`,
      timestamp: adminDb.FieldValue.serverTimestamp(),
      seen: false,
      createdAt: adminDb.FieldValue.serverTimestamp(),
      updatedAt: adminDb.FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection(COLLECTION_NAME).add(notificationData);
    
    const notification = {
      id: docRef.id,
      ...notificationData,
    };

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating admin notification:', error);
    return NextResponse.json(
      { error: 'Failed to create admin notification' },
      { status: 500 }
    );
  }
}

// PUT /api/admin-notifications/[id] - Update a notification
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const updateData = {
      ...data,
      updatedAt: adminDb.FieldValue.serverTimestamp(),
    };

    await adminDb.collection(COLLECTION_NAME).doc(id).update(updateData);
    
    return NextResponse.json({ message: 'Notification updated successfully' });
  } catch (error) {
    console.error('Error updating admin notification:', error);
    return NextResponse.json(
      { error: 'Failed to update admin notification' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin-notifications/[id] - Delete a notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await adminDb.collection(COLLECTION_NAME).doc(id).delete();
    
    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete admin notification' },
      { status: 500 }
    );
  }
}
