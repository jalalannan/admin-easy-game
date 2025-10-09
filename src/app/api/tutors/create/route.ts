export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import bcrypt from 'bcryptjs';


/**
 * API Route for creating tutors with bcrypt password hashing
 * Connects to Firebase Emulator in development, Live Firebase in production
 * POST /api/tutors/create
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, ...tutorData } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // Hash the password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create tutor document reference
    const tutorRef = adminDb.collection('tutors').doc();

    // Check if email already exists
    if (tutorData.email) {
        const emailQuery = await adminDb
            .collection('tutors')
            .where('email', '==', tutorData.email)
            .limit(1)
            .get();
            
        if (!emailQuery.empty) {
            return NextResponse.json(
                { success: false, error: 'A tutor with this email already exists' },
                { status: 409 }
            );
        }
    }

    // Check if phone already exists
    if (tutorData.phone) {
        const phoneQuery = await adminDb
            .collection('tutors')
            .where('phone', '==', tutorData.phone)
            .limit(1)
            .get();

        if (!phoneQuery.empty) {
            return NextResponse.json(
                { success: false, error: 'A tutor with this phone already exists' },
                { status: 409 }
            );
        }
    }
    // Prepare tutor data with hashed password
    const newTutor = {
      ...tutorData,
      password: hashedPassword,
      locked: '0',
      cancelled: '0',
      version: '0',
      send_notifications: '1',
      verified: '0',
      token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      test_user: '0',
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };

    // Remove undefined/null values
    const cleanedTutor = Object.fromEntries(
      Object.entries(newTutor).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );

    await tutorRef.set(cleanedTutor);

    console.log('✅ Tutor created with hashed password:', tutorRef.id);

    return NextResponse.json({
      success: true,
      tutorId: tutorRef.id,
      message: 'Tutor created successfully',
    });
  } catch (error) {
    console.error('❌ Create tutor error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create tutor' 
      },
      { status: 500 }
    );
  }
}

