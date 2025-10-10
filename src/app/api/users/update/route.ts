export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import bcrypt from 'bcryptjs';

/**
 * API Route for updating users with bcrypt password hashing
 * Connects to Firebase Emulator in development, Live Firebase in production
 * POST /api/users/update
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, password, ...userData } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection('users').doc(userId);

    // Check if email is being updated and if it already exists for another user
    if (userData.email) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }
      
      const currentDoc = await userRef.get();
      const currentData = currentDoc.exists ? currentDoc.data() : null;

      // If the email is being changed
      if (currentData && currentData.email !== userData.email) {
        // Query for any other user with the same email
        const emailQuery = await adminDb
          .collection('users')
          .where('email', '==', userData.email)
          .where('deleted_at', '==', null)
          .get();

        // If another user with this email exists (excluding this user)
        const emailExists = emailQuery.docs.some(doc => doc.id !== userId);

        if (emailExists) {
          return NextResponse.json(
            { success: false, error: 'Email already exists for another user' },
            { status: 409 }
          );
        }
      }
    }

    // Update Firebase Auth user if needed
    const auth = getAuth();
    const authUpdateData: any = {};
    
    if (userData.displayName !== undefined) {
      authUpdateData.displayName = userData.displayName;
    }
    
    if (userData.email !== undefined) {
      authUpdateData.email = userData.email;
    }
    
    if (userData.emailVerified !== undefined) {
      authUpdateData.emailVerified = userData.emailVerified;
    }

    // Update Firebase Auth if there are changes
    if (Object.keys(authUpdateData).length > 0) {
      await auth.updateUser(userId, authUpdateData);
      console.log('✅ Firebase Auth user updated');
    }

    // Update password in Firebase Auth if provided
    if (password && password.trim() !== '') {
      await auth.updateUser(userId, { password });
      console.log('🔐 Firebase Auth password updated');
    }

    // Prepare update data for Firestore
    const updateData: any = {
      ...userData,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Only hash and update password in Firestore if a new password is provided
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
      console.log('🔐 Password updated with bcrypt hash in Firestore');
    }

    // Remove undefined/null values
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );

    await userRef.update(cleanedData);

    console.log('✅ User updated:', userId);

    return NextResponse.json({
      success: true,
      userId,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('❌ Update user error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update user' 
      },
      { status: 500 }
    );
  }
}
