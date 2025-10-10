export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import bcrypt from 'bcryptjs';

/**
 * API Route for creating students with bcrypt password hashing
 * Connects to Firebase Emulator in development, Live Firebase in production
 * POST /api/students/create
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, ...studentData } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentData.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email already exists
    if (!studentData.email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailQuery = await adminDb
      .collection('students')
      .where('email', '==', studentData.email)
      .where('deleted_at', '==', null)
      .limit(1)
      .get();

    if (!emailQuery.empty) {
      return NextResponse.json(
        { success: false, error: 'A student with this email already exists' },
        { status: 409 }
      );
    }

    // Check if phone_number already exists (if provided)
    if (studentData.phone_number) {
      const phoneQuery = await adminDb
        .collection('students')
        .where('phone_number', '==', studentData.phone_number)
        .where('deleted_at', '==', null)
        .limit(1)
        .get();

      if (!phoneQuery.empty) {
        return NextResponse.json(
          { success: false, error: 'A student with this phone number already exists' },
          { status: 409 }
        );
      }
    }

    // Hash the password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student document reference
    const studentRef = adminDb.collection('students').doc();

    // Prepare student data with hashed password
    const newStudent = {
      ...studentData,
      password: hashedPassword,
      locked: '0',
      cancelled: '0',
      version: '0',
      send_notifications: '1',
      verified: '0',
      is_banned: '0',
      token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      test_user: '0',
      deleted_at: null, // Ensure new students are not marked as deleted
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };

    // Remove undefined/empty values but keep null values for deleted_at
    const cleanedStudent = Object.fromEntries(
      Object.entries(newStudent).filter(([key, v]) => {
        if (key === 'deleted_at') return true; // Always keep deleted_at field
        return v !== undefined && v !== null && v !== '';
      })
    );

    await studentRef.set(cleanedStudent);

    console.log('✅ Student created with hashed password:', studentRef.id);

    return NextResponse.json({
      success: true,
      studentId: studentRef.id,
      message: 'Student created successfully',
    });
  } catch (error) {
    console.error('❌ Create student error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create student' 
      },
      { status: 500 }
    );
  }
}

