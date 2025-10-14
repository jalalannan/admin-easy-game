export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';

/**
 * API Route for getting or creating a room for student/tutor
 * GET /api/support/room?user_type={user_type}&token={token}
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('user_type');
    const token = request.headers.get('token');

    if (!userType || !token) {
      return NextResponse.json(
        { success: false, error: 'User type and token are required' },
        { status: 400 }
      );
    }

    if (!['student', 'tutor'].includes(userType)) {
      return NextResponse.json(
        { success: false, error: 'User type must be student or tutor' },
        { status: 400 }
      );
    }

    let user = null;
    let userId = null;

    // Find user by token
    if (userType === 'student') {
      const studentsSnapshot = await adminDb
        .collection('students')
        .where('token', '==', token)
        .limit(1)
        .get();

      if (!studentsSnapshot.empty) {
        const studentDoc = studentsSnapshot.docs[0];
        user = { id: studentDoc.id, ...studentDoc.data() };
        userId = studentDoc.id;
      }
    } else if (userType === 'tutor') {
      const tutorsSnapshot = await adminDb
        .collection('tutors')
        .where('token', '==', token)
        .limit(1)
        .get();

      if (!tutorsSnapshot.empty) {
        const tutorDoc = tutorsSnapshot.docs[0];
        user = { id: tutorDoc.id, ...tutorDoc.data() };
        userId = tutorDoc.id;
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if room already exists
    const existingRoomSnapshot = await adminDb
      .collection('customer_support_rooms')
      .where('user_id', '==', userId)
      .limit(1)
      .get();

    let room = null;

    if (!existingRoomSnapshot.empty) {
      // Room exists, get it with admin data
      const roomDoc = existingRoomSnapshot.docs[0];
      const roomData = roomDoc.data();

      // Get admin data if exists
      let admin = null;
      if (roomData.admin_id) {
        const adminDoc = await adminDb.collection('users').doc(roomData.admin_id).get();
        if (adminDoc.exists) {
          admin = { id: adminDoc.id, ...adminDoc.data() };
        }
      }

      // Get latest message
      let latestMessage = null;
      const latestMessageQuery = adminDb
        .collection('customer_support_chats')
        .where('room_id', '==', roomDoc.id)
        .orderBy('created_at', 'desc')
        .limit(1);

      const latestMessageSnapshot = await latestMessageQuery.get();
      if (!latestMessageSnapshot.empty) {
        const latestMsgDoc = latestMessageSnapshot.docs[0];
        latestMessage = { id: latestMsgDoc.id, ...latestMsgDoc.data() };
      }

      room = {
        id: roomDoc.id,
        ...roomData,
        admin,
        latestMessage
      };
    } else {
      // Create new room
      const newRoomData = {
        user_id: userId,
        user_type: userType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const roomRef = await adminDb.collection('customer_support_rooms').add(newRoomData);
      
      room = {
        id: roomRef.id,
        ...newRoomData,
        admin: null,
        latestMessage: null
      };
    }

    return NextResponse.json({
      success: true,
      room
    });

  } catch (error) {
    console.error('❌ Room creation/retrieval error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get or create room' 
      },
      { status: 500 }
    );
  }
}
