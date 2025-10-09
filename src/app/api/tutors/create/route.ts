import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/firebase-edge';
import { collection, query, where, limit, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { hashPassword } from '@/lib/crypto-edge';

export const runtime = 'edge';

/**
 * API Route for creating tutors with Web Crypto password hashing
 * Compatible with Edge Runtime for Cloudflare Pages
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

    // Check if email already exists
    if (tutorData.email) {
        const emailQuery = query(
            collection(db, 'tutors'),
            where('email', '==', tutorData.email),
            limit(1)
        );
        const emailSnapshot = await getDocs(emailQuery);
            
        if (!emailSnapshot.empty) {
            return NextResponse.json(
                { success: false, error: 'A tutor with this email already exists' },
                { status: 409 }
            );
        }
    }

    // Check if phone already exists
    if (tutorData.phone) {
        const phoneQuery = query(
            collection(db, 'tutors'),
            where('phone', '==', tutorData.phone),
            limit(1)
        );
        const phoneSnapshot = await getDocs(phoneQuery);

        if (!phoneSnapshot.empty) {
            return NextResponse.json(
                { success: false, error: 'A tutor with this phone already exists' },
                { status: 409 }
            );
        }
    }

    // Hash the password with Web Crypto API
    const hashedPassword = await hashPassword(password);

    // Create tutor document reference
    const tutorRef = doc(collection(db, 'tutors'));

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
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    // Remove undefined/null values
    const cleanedTutor = Object.fromEntries(
      Object.entries(newTutor).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );

    await setDoc(tutorRef, cleanedTutor);

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

