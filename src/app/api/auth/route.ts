import { NextRequest, NextResponse } from 'next/server';

// Simulated storage (in production, use database)
const users = new Map<string, {
  email: string;
  otp?: string;
  otpExpiry?: number;
  password?: string;
  verified: boolean;
  premature: boolean; // Created but not verified
  userId: string;
  profileKey?: string;
  createdAt: number;
}>();

const otpStore = new Map<string, {
  code: string;
  expiry: number;
}>();

// Password reset token store (demo only)
const resetTokens = new Map<string, {
  email: string;
  expiry: number;
}>();

/**
 * Authentication API
 * Handles user registration, OTP generation/validation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'register': {
        const { email, sessionId } = body;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return NextResponse.json({
            success: false,
            error: 'Invalid email address',
          }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = users.get(email.toLowerCase());
        
        if (existingUser) {
          if (existingUser.verified) {
            // Account exists and is verified - user should login instead
            return NextResponse.json({
              success: false,
              error: 'Account already exists',
              accountExists: true,
              shouldLogin: true,
            }, { status: 409 });
          } else {
            // Premature account - resend OTP
            const otp = generateOTP();
            const otpExpiry = Date.now() + (10 * 60 * 1000); // 10 minutes

            existingUser.otp = otp;
            existingUser.otpExpiry = otpExpiry;
            otpStore.set(email.toLowerCase(), { code: otp, expiry: otpExpiry });

            // In production, send OTP via email service
            console.log(`[AUTH] Resent OTP for ${email}: ${otp}`);

            return NextResponse.json({
              success: true,
              message: 'OTP resent to your email',
              isPremature: true,
              userId: existingUser.userId,
              otp, // Remove in production
            });
          }
        }

        // Create new user account
        const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        const otp = generateOTP();
        const otpExpiry = Date.now() + (10 * 60 * 1000); // 10 minutes

        const newUser = {
          email: email.toLowerCase(),
          otp,
          otpExpiry,
          verified: false,
          premature: true,
          userId,
          createdAt: Date.now(),
        };

        users.set(email.toLowerCase(), newUser);
        otpStore.set(email.toLowerCase(), { code: otp, expiry: otpExpiry });

        // In production, send OTP via email service
        console.log(`[AUTH] Generated OTP for ${email}: ${otp}`);

        return NextResponse.json({
          success: true,
          message: 'Account created. OTP sent to your email',
          userId,
          otp, // Remove in production - only for demo
        });
      }

      case 'validate-otp': {
        const { email, otp } = body;

        if (!email || !otp) {
          return NextResponse.json({
            success: false,
            error: 'Email and OTP required',
          }, { status: 400 });
        }

        const user = users.get(email.toLowerCase());
        
        if (!user) {
          return NextResponse.json({
            success: false,
            error: 'User not found',
          }, { status: 404 });
        }

        const storedOtp = otpStore.get(email.toLowerCase());
        
        if (!storedOtp) {
          return NextResponse.json({
            success: false,
            error: 'OTP not found or expired',
          }, { status: 400 });
        }

        if (Date.now() > storedOtp.expiry) {
          otpStore.delete(email.toLowerCase());
          return NextResponse.json({
            success: false,
            error: 'OTP expired',
            expired: true,
          }, { status: 400 });
        }

        if (storedOtp.code !== otp) {
          return NextResponse.json({
            success: false,
            error: 'Invalid OTP',
          }, { status: 400 });
        }

        // Mark user as verified
        user.verified = true;
        user.premature = false;
        delete user.otp;
        delete user.otpExpiry;
        otpStore.delete(email.toLowerCase());

        return NextResponse.json({
          success: true,
          message: 'OTP validated successfully',
          userId: user.userId,
          email: user.email,
        });
      }

      case 'resend-otp': {
        const { email } = body;

        if (!email) {
          return NextResponse.json({
            success: false,
            error: 'Email required',
          }, { status: 400 });
        }

        const user = users.get(email.toLowerCase());
        
        if (!user) {
          return NextResponse.json({
            success: false,
            error: 'User not found',
          }, { status: 404 });
        }

        if (user.verified) {
          return NextResponse.json({
            success: false,
            error: 'User already verified',
          }, { status: 400 });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = Date.now() + (10 * 60 * 1000);

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        otpStore.set(email.toLowerCase(), { code: otp, expiry: otpExpiry });

        console.log(`[AUTH] Resent OTP for ${email}: ${otp}`);

        return NextResponse.json({
          success: true,
          message: 'OTP resent',
          otp, // Remove in production
        });
      }

      case 'check-email': {
        const { email } = body;

        if (!email) {
          return NextResponse.json({
            success: false,
            error: 'Email required',
          }, { status: 400 });
        }

        const user = users.get(email.toLowerCase());

        return NextResponse.json({
          success: true,
          exists: !!user,
          verified: user?.verified || false,
          premature: user?.premature || false,
        });
      }

      case 'send-password-reset': {
        const { email } = body;

        if (!email) {
          return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
        }
        const user = users.get(email.toLowerCase());
        if (!user) {
          return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const token = `rst_${Math.random().toString(36).substring(2, 12)}${Date.now()}`;
        const expiry = Date.now() + (60 * 60 * 1000); // 1 hour
        resetTokens.set(token, { email: user.email, expiry });

        const resetUrl = `/reset?token=${token}`; // demo link
        console.log(`[AUTH] Sent password reset for ${email}: ${resetUrl}`);
        return NextResponse.json({ success: true, status: 'SUCCESS', token, resetUrl });
      }

      case 'complete-password-reset': {
        const { token, password } = body;
        if (!token || !password) {
          return NextResponse.json({ success: false, error: 'Token and password required' }, { status: 400 });
        }
        const rec = resetTokens.get(token);
        if (!rec) {
          return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 400 });
        }
        if (Date.now() > rec.expiry) {
          resetTokens.delete(token);
          return NextResponse.json({ success: false, error: 'Token expired' }, { status: 400 });
        }
        const user = users.get(rec.email.toLowerCase());
        if (!user) {
          return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }
        user.password = password; // demo: do not store plaintext in production
        user.verified = true;
        user.premature = false;
        resetTokens.delete(token);
        console.log(`[AUTH] Password reset completed for ${user.email}`);
        return NextResponse.json({ success: true });
      }

      case 'set-password': {
        const { email, password } = body;

        if (!email || !password) {
          return NextResponse.json({
            success: false,
            error: 'Email and password required',
          }, { status: 400 });
        }

        const user = users.get(email.toLowerCase());
        
        if (!user) {
          return NextResponse.json({
            success: false,
            error: 'User not found',
          }, { status: 404 });
        }

        if (!user.verified) {
          return NextResponse.json({
            success: false,
            error: 'User not verified',
          }, { status: 400 });
        }

        // In production, hash the password!
        user.password = password;

        console.log(`[AUTH] Password set for ${email}`);

        return NextResponse.json({
          success: true,
          message: 'Password set successfully',
        });
      }

      case 'login': {
        const { email, password } = body;

        if (!email || !password) {
          return NextResponse.json({
            success: false,
            error: 'Email and password required',
          }, { status: 400 });
        }

        const user = users.get(email.toLowerCase());
        
        if (!user) {
          return NextResponse.json({
            success: false,
            error: 'Invalid credentials',
          }, { status: 401 });
        }

        if (user.password !== password) {
          return NextResponse.json({
            success: false,
            error: 'Invalid credentials',
          }, { status: 401 });
        }

        console.log(`[AUTH] User logged in: ${email}`);

        return NextResponse.json({
          success: true,
          userId: user.userId,
          email: user.email,
          profileKey: user.profileKey,
          message: 'Login successful',
        });
      }

      case 'create-profile': {
        const { userId, email, profileConfig } = body;

        const user = email ? users.get(email.toLowerCase()) : 
                      Array.from(users.values()).find(u => u.userId === userId);

        if (!user) {
          return NextResponse.json({
            success: false,
            error: 'User not found',
          }, { status: 404 });
        }

        // Generate profile key
        const profileKey = `profile_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        user.profileKey = profileKey;

        console.log(`[AUTH] Created profile for ${user.email}: ${profileKey}`);
        console.log('[AUTH] Profile config:', profileConfig);

        return NextResponse.json({
          success: true,
          profileKey,
          message: 'Profile created successfully',
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({
      success: false,
      error: 'email parameter required',
    }, { status: 400 });
  }

  const user = users.get(email.toLowerCase());

  return NextResponse.json({
    success: true,
    exists: !!user,
    verified: user?.verified || false,
    premature: user?.premature || false,
  });
}
