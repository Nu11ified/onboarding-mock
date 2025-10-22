import { NextRequest, NextResponse } from 'next/server';

// Simulated in-memory storage (in production, use database)
const sessions = new Map<string, {
  sessionId: string;
  chatId: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  messages?: any[];
  transferredFrom?: string;
  transferredTo?: string;
  transferredAt?: number;
}>();

/**
 * Session Management API
 * Handles anonymous user sessions and session transfers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        // Create a new anonymous session
        const sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        const chatId = `chat_${sessionId}`;
        const userId = `user_anon_${Date.now()}`;
        const now = Date.now();
        const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours

        const session = {
          sessionId,
          chatId,
          userId,
          createdAt: now,
          expiresAt,
          messages: [],
        };

        sessions.set(sessionId, session);

        return NextResponse.json({
          success: true,
          session: {
            sessionId,
            chatId,
            createdAt: now,
            expiresAt,
          },
        });
      }

      case 'get': {
        // Retrieve an existing session
        const { sessionId } = body;
        const session = sessions.get(sessionId);

        if (!session) {
          return NextResponse.json({
            success: false,
            error: 'Session not found',
          }, { status: 404 });
        }

        // Check if expired
        if (Date.now() > session.expiresAt) {
          sessions.delete(sessionId);
          return NextResponse.json({
            success: false,
            error: 'Session expired',
          }, { status: 410 });
        }

        return NextResponse.json({
          success: true,
          session: {
            sessionId: session.sessionId,
            chatId: session.chatId,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
          },
        });
      }

      case 'transfer': {
        // Transfer session from anonymous to authenticated user
        const { anonSessionId, anonUserId, authenticatedUserId, chatId } = body;

        const anonSession = sessions.get(anonSessionId);
        if (!anonSession) {
          return NextResponse.json({
            success: false,
            error: 'Anonymous session not found',
          }, { status: 404 });
        }

        // Create new session for authenticated user
        const newSessionId = `auth_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        const newSession = {
          ...anonSession,
          sessionId: newSessionId,
          userId: authenticatedUserId,
          chatId: chatId || anonSession.chatId,
          transferredFrom: anonSessionId,
          transferredAt: Date.now(),
        };

        sessions.set(newSessionId, newSession);
        
        // Mark old session as transferred but keep for audit
        anonSession.transferredTo = newSessionId;
        anonSession.transferredAt = Date.now();

        return NextResponse.json({
          success: true,
          message: 'Session transferred successfully',
          newSessionId,
          chatId: newSession.chatId,
        });
      }

      case 'update-messages': {
        // Update messages in session
        const { sessionId, messages } = body;
        const session = sessions.get(sessionId);

        if (!session) {
          return NextResponse.json({
            success: false,
            error: 'Session not found',
          }, { status: 404 });
        }

        session.messages = messages;
        return NextResponse.json({ success: true });
      }

      case 'cleanup': {
        // Clean up expired sessions
        const now = Date.now();
        let cleaned = 0;

        for (const [sessionId, session] of sessions.entries()) {
          if (now > session.expiresAt) {
            sessions.delete(sessionId);
            cleaned++;
          }
        }

        return NextResponse.json({
          success: true,
          cleaned,
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({
      success: false,
      error: 'sessionId parameter required',
    }, { status: 400 });
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return NextResponse.json({
      success: false,
      error: 'Session not found',
    }, { status: 404 });
  }

  // Check if expired
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return NextResponse.json({
      success: false,
      error: 'Session expired',
    }, { status: 410 });
  }

  return NextResponse.json({
    success: true,
    session: {
      sessionId: session.sessionId,
      chatId: session.chatId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      messages: session.messages,
    },
  });
}
