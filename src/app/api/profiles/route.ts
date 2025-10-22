import { NextRequest, NextResponse } from 'next/server';

// Mock database for profiles (replace with real DB in production)
const mockProfiles = new Map<string, any>();

// Initialize with some mock profiles for testing
mockProfiles.set('prof_demo_001', {
  id: 'prof_demo_001',
  profileKey: 'profile_abc123',
  name: 'Production Line A',
  deviceCount: 3,
  createdAt: new Date('2024-01-15').toISOString(),
  userId: 'user_test_123',
});

mockProfiles.set('prof_demo_002', {
  id: 'prof_demo_002',
  profileKey: 'profile_xyz789',
  name: 'Assembly Station B',
  deviceCount: 1,
  createdAt: new Date('2024-02-20').toISOString(),
  userId: 'user_test_123',
});

export async function GET(request: NextRequest) {
  try {
    // In production, get userId from authentication
    const userId = 'user_test_123'; // Mock user ID
    
    // Filter profiles by user
    const userProfiles = Array.from(mockProfiles.values()).filter(
      (profile) => profile.userId === userId
    );

    return NextResponse.json({
      success: true,
      profiles: userProfiles,
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch profiles',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const { name, config, userId } = body;
        
        // Generate profile key
        const profileKey = `profile_${Math.random().toString(36).substring(2, 15)}`;
        const profileId = `prof_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        const newProfile = {
          id: profileId,
          profileKey,
          name: name || 'Untitled Profile',
          deviceCount: 0,
          createdAt: new Date().toISOString(),
          userId: userId || 'user_test_123',
          config: config || {},
        };
        
        mockProfiles.set(profileId, newProfile);
        
        return NextResponse.json({
          success: true,
          profile: newProfile,
          profileKey,
        });
      }

      case 'get': {
        const { profileId } = body;
        const profile = mockProfiles.get(profileId);
        
        if (!profile) {
          return NextResponse.json(
            {
              success: false,
              error: 'Profile not found',
            },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          profile,
        });
      }

      case 'update': {
        const { profileId, updates } = body;
        const profile = mockProfiles.get(profileId);
        
        if (!profile) {
          return NextResponse.json(
            {
              success: false,
              error: 'Profile not found',
            },
            { status: 404 }
          );
        }
        
        const updatedProfile = { ...profile, ...updates };
        mockProfiles.set(profileId, updatedProfile);
        
        return NextResponse.json({
          success: true,
          profile: updatedProfile,
        });
      }

      case 'increment-device-count': {
        const { profileKey } = body;
        
        // Find profile by profileKey
        const profile = Array.from(mockProfiles.values()).find(
          (p) => p.profileKey === profileKey
        );
        
        if (profile) {
          profile.deviceCount++;
          mockProfiles.set(profile.id, profile);
        }
        
        return NextResponse.json({
          success: true,
          deviceCount: profile?.deviceCount || 0,
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in profiles API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
