import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/firebase-edge';
import { collection, query, where, limit, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { hashPassword } from '@/lib/crypto-edge';

export const runtime = 'edge';

/**
 * API Route for creating students with Web Crypto password hashing
 * Compatible with Edge Runtime for Cloudflare Pages
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

    // Check if email already exists
    if (!studentData.email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailQuery = query(
      collection(db, 'students'),
      where('email', '==', studentData.email),
      limit(1)
    );
    const emailSnapshot = await getDocs(emailQuery);

    if (!emailSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'A student with this email already exists' },
        { status: 409 }
      );
    }

    // Check if phone_number already exists (if provided)
    if (studentData.phone_number) {
      const phoneQuery = query(
        collection(db, 'students'),
        where('phone_number', '==', studentData.phone_number),
        limit(1)
      );
      const phoneSnapshot = await getDocs(phoneQuery);

      if (!phoneSnapshot.empty) {
        return NextResponse.json(
          { success: false, error: 'A student with this phone number already exists' },
          { status: 409 }
        );
      }
    }

    // Hash the password with Web Crypto API
    const hashedPassword = await hashPassword(password);

    // Create student document reference
    const studentRef = doc(collection(db, 'students'));

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
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    // Remove undefined/null values
    const cleanedStudent = Object.fromEntries(
      Object.entries(newStudent).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );

    await setDoc(studentRef, cleanedStudent);

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

