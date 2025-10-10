export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import bcrypt from 'bcryptjs';

/**
 * API Route for creating users with bcrypt password hashing
 * Connects to Firebase Emulator in development, Live Firebase in production
 * POST /api/users/create
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 API received body:', body);
    console.log('🔍 Password in body:', body.password);
    
    const { password, ...userData } = body;

    if (!password) {
      console.log('❌ No password provided in request');
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email already exists
    if (!userData.email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailQuery = await adminDb
      .collection('users')
      .where('email', '==', userData.email)
      .where('deleted_at', '==', null)
      .limit(1)
      .get();

    if (!emailQuery.empty) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Create user in Firebase Auth first
    const auth = getAuth();
    const firebaseUser = await auth.createUser({
      email: userData.email,
      password: password, // Firebase Auth will hash this automatically
      displayName: userData.displayName,
      emailVerified: userData.emailVerified || false,
    });

    console.log('✅ Firebase Auth user created:', firebaseUser.uid);

    // Hash the password with bcrypt for Firestore storage (for consistency with students/tutors)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare user data with hashed password for Firestore
    const newUser = {
      ...userData,
      password: hashedPassword,
      emailVerified: userData.emailVerified || false,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      sendNotifications: userData.sendNotifications !== undefined ? userData.sendNotifications : true,
      deleted_at: null, // Ensure new users are not marked as deleted
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Remove undefined/empty values but keep null values for deleted_at
    const cleanedUser = Object.fromEntries(
      Object.entries(newUser).filter(([key, v]) => {
        if (key === 'deleted_at') return true; // Always keep deleted_at field
        return v !== undefined && v !== null && v !== '';
      })
    );

    // Store user data in Firestore using the Firebase Auth UID
    await adminDb.collection('users').doc(firebaseUser.uid).set(cleanedUser);

    console.log('✅ User created in Firestore with hashed password:', firebaseUser.uid);

    return NextResponse.json({
      success: true,
      userId: firebaseUser.uid,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('❌ Create user error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create user' 
      },
      { status: 500 }
    );
  }
}
