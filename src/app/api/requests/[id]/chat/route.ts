import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/config/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = id;
    const { searchParams } = new URL(request.url);
    
    // Validate requestId
    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }
    
    // Get pagination parameters with validation
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam), 1), 50) : 10; // Clamp between 1-50
    const lastMessageId = searchParams.get('lastMessageId');
    const chatId = searchParams.get('chatId');
    
    console.log('Fetching messages for request:', requestId, 'chatId:', chatId, 'lastMessageId:', lastMessageId);
    // Get all chat documents for this request (multiple tutors can chat with student)
    const chatQuerySnapshot = await adminDb
      .collection('request_chats')
      .where('request_id', '==', requestId)
      .get();
      
    if (chatQuerySnapshot.empty) {
      // Return empty messages if no chats exist yet
      return NextResponse.json({
        success: true,
        messages: [],
        hasMore: false,
        totalMessages: 0,
        chats: []
      });
    }

    // Get all chats for this request
    const allChats = chatQuerySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));



    // If no specific chatId provided, return all chats info
    if (!chatId) {
      return NextResponse.json({
        success: true,
        chats: allChats,
        messages: [],
        hasMore: false,
        totalMessages: 0
      });
    }

    // Validate chatId format
    if (typeof chatId !== 'string' || chatId.length === 0) {
      return NextResponse.json(
        { error: 'Invalid chat ID' },
        { status: 400 }
      );
    }

    // Find the specific chat document
    const chatDoc = chatQuerySnapshot.docs.find(doc => doc.id === chatId);
    if (!chatDoc || !chatDoc.exists) {
      return NextResponse.json({
        success: true,
        messages: [],
        hasMore: false,
        totalMessages: 0,
        chats: allChats,
        error: 'Chat not found'
      });
    }
    
    // Build query for messages subcollection using the chat document ID
    let messagesQuery = adminDb
      .collection('request_chats')
      .doc(chatDoc.id)
      .collection('messages')
      .orderBy('created_at', 'desc')
      .limit(limit);
    
    // Apply pagination using startAfter if lastMessageId is provided
    if (lastMessageId) {
      try {
        const lastMessageDoc = await adminDb
          .collection('request_chats')
          .doc(chatDoc.id)
          .collection('messages')
          .doc(lastMessageId)
          .get();
        
        if (lastMessageDoc.exists) {
          messagesQuery = messagesQuery.startAfter(lastMessageDoc);
        } else {
          console.warn(`Last message document ${lastMessageId} not found, ignoring pagination`);
        }
      } catch (error) {
        console.error('Error fetching last message for pagination:', error);
        // Continue without pagination if there's an error
      }
    }
    
    const messagesSnapshot = await messagesQuery.get();
    
    let messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Reverse to show oldest first in the UI
    messages.reverse();
    
    // Check if there are more messages
    const hasMore = messagesSnapshot.docs.length === limit;
    
    console.log(`Loaded ${messages.length} messages, hasMore: ${hasMore}`);
    
    return NextResponse.json({
      success: true,
      messages: messages,
      hasMore: hasMore,
      totalMessages: messages.length,
      chats: allChats,
      chatId: chatDoc.id
    });
    
  } catch (error: any) {
    console.error('Error fetching chat messages:', error);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to fetch chat messages';
    let statusCode = 500;
    
    if (error.code === 'permission-denied') {
      errorMessage = 'Permission denied to access chat messages';
      statusCode = 403;
    } else if (error.code === 'not-found') {
      errorMessage = 'Request or chat not found';
      statusCode = 404;
    } else if (error.code === 'unavailable') {
      errorMessage = 'Service temporarily unavailable';
      statusCode = 503;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false,
        messages: [],
        hasMore: false,
        totalMessages: 0,
        chats: []
      },
      { status: statusCode }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = id;
    const body = await request.json();
    
    const { message, messageType = 'text', chatId } = body;
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }
    
    // Validate message type
    const validMessageTypes = [
      'text', 'voice', 'image', 'file', 'requestcreated', 'bidinvite', 
      'bidinviterejected', 'tutorbid', 'tutoreditbid', 'studentreject',
      'requesttaken', 'studentchangemind', 'studentaccept', 'studentpaid',
      'studentongoing', 'tutorcomplete', 'studentacceptcomplete',
      'studentrejectcomplete', 'studentcancelrequest', 'tutordeclineaccepted',
      'zoomcreated', 'zoomready'
    ];
    
    if (!validMessageTypes.includes(messageType.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid message type' },
        { status: 400 }
      );
    }
    
    // Find the specific chat document
    let chatDoc = null;
    
    if (chatId) {
      // Use the provided chatId
      const chatDocSnapshot = await adminDb
        .collection('request_chats')
        .doc(chatId)
        .get();
      
      if (chatDocSnapshot.exists) {
        chatDoc = chatDocSnapshot;
      }
    } else {
      // If no chatId provided, get the first available chat for this request
      const chatQuerySnapshot = await adminDb
        .collection('request_chats')
        .where('request_id', '==', requestId)
        .limit(1)
        .get();
      
      chatDoc = chatQuerySnapshot.empty ? null : chatQuerySnapshot.docs[0];
    }
    
    if (!chatDoc || !chatDoc.exists) {
      return NextResponse.json(
        { error: 'Chat not found. Please select a valid chat.' },
        { status: 404 }
      );
    }
    
    // Create new message in the messages subcollection
    const newMessageRef = adminDb
      .collection('request_chats')
      .doc(chatDoc!.id)
      .collection('messages')
      .doc();
    
    const newMessage = {
      id: newMessageRef.id,
      message,
      message_type: messageType.toLowerCase(),
      sender_type: 'admin',
      sender_id: 'admin',
      created_at: new Date(),
      updated_at: new Date(),
      seen: false
    };
    
    // Add message to subcollection
    await newMessageRef.set(newMessage);
    
    // Update chat document with last message info
    await adminDb.collection('request_chats').doc(chatDoc!.id).update({
      last_message: message,
      last_message_type: messageType,
      last_message_at: new Date(),
      updated_at: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: newMessage
    });
    
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
