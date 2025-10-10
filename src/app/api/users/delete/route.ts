export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * API Route for deleting users from both Firebase Auth and Firestore
 * Connects to Firebase Emulator in development, Live Firebase in production
 * POST /api/users/delete
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting user:', userId);

    // Delete user from Firebase Auth
    const auth = getAuth();
    try {
      await auth.deleteUser(userId);
      console.log('✅ User deleted from Firebase Auth:', userId);
    } catch (authError: any) {
      console.error('❌ Error deleting from Firebase Auth:', authError);
      // Continue with Firestore deletion even if Firebase Auth deletion fails
    }

    // Soft delete user from Firestore (set deleted_at timestamp)
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
      deleted_at: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log('✅ User soft deleted from Firestore:', userId);

    // Deactivate all user roles
    const userRolesQuery = adminDb
      .collection('userRoles')
      .where('userId', '==', userId)
      .where('isActive', '==', true);

    const userRolesSnapshot = await userRolesQuery.get();
    
    for (const roleDoc of userRolesSnapshot.docs) {
      await roleDoc.ref.update({
        isActive: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    console.log('✅ User roles deactivated:', userRolesSnapshot.docs.length);

    return NextResponse.json({
      success: true,
      userId,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete user error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete user' 
      },
      { status: 500 }
    );
  }
}
