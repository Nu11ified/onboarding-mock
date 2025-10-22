import { NextRequest, NextResponse } from 'next/server';

// Simulated device storage
const devices = new Map<string, {
  deviceId: string;
  profileKey: string;
  mode: 'demo' | 'live';
  topic: string;
  sessionId: string;
  sessionExpiry: number;
  status: 'spawning' | 'active' | 'error';
  brokerEndpoint: string;
  brokerPort: number;
  username: string;
  password: string;
  config?: any;
  createdAt: number;
}>();

/**
 * Device Management API
 * Handles device spawning, MI container management
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'spawn': {
        const { 
          profileKey, 
          mode, 
          sessionId, 
          sessionExpiry, 
          config 
        } = body;

        if (!profileKey || !mode || !sessionId) {
          return NextResponse.json({
            success: false,
            error: 'profileKey, mode, and sessionId required',
          }, { status: 400 });
        }

        // Check if device already exists for this session
        const existingDevice = Array.from(devices.values()).find(
          d => d.sessionId === sessionId && d.profileKey === profileKey
        );

        if (existingDevice && existingDevice.status === 'active') {
          return NextResponse.json({
            success: false,
            error: 'Device is already active',
            deviceId: existingDevice.deviceId,
            alreadyActive: true,
          }, { status: 409 });
        }

        // Generate device ID and topic
        const deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const topic = mode === 'demo' 
          ? `/demo/${deviceId}` 
          : `/ext/${deviceId.substring(4, 16)}`;

        // Create device entry
        const device = {
          deviceId,
          profileKey,
          mode,
          topic,
          sessionId,
          sessionExpiry: sessionExpiry || (Date.now() + 24 * 60 * 60 * 1000),
          status: 'spawning' as const,
          brokerEndpoint: mode === 'demo' ? 'mqtt.demo.microai.com' : 'mqtt.microai.com',
          brokerPort: mode === 'demo' ? 1883 : 8883,
          username: deviceId,
          password: profileKey,
          config,
          createdAt: Date.now(),
        };

        devices.set(deviceId, device);

        // Simulate spawning delay
        setTimeout(() => {
          const dev = devices.get(deviceId);
          if (dev) {
            dev.status = 'active';
          }
        }, mode === 'demo' ? 2000 : 5000);

        console.log(`[DEVICE] Spawning ${mode} device: ${deviceId}`);

        return NextResponse.json({
          success: true,
          deviceId,
          topic,
          brokerEndpoint: device.brokerEndpoint,
          brokerPort: device.brokerPort,
          username: device.username,
          password: device.password,
          status: 'spawning',
          sampleSchema: mode === 'demo' ? {
            CycleTime: [{ v: 0, t: 0 }],
            "1": [{ v: 0, t: 0 }],
            "2": [{ v: 0, t: 0 }],
          } : {
            CycleTime: [{ v: 0, t: 0 }],
            "1": [{ v: 0, t: 0 }],
            "2": [{ v: 0, t: 0 }],
            // Add more channels based on config
          },
        });
      }

      case 'status': {
        const { deviceId } = body;

        if (!deviceId) {
          return NextResponse.json({
            success: false,
            error: 'deviceId required',
          }, { status: 400 });
        }

        const device = devices.get(deviceId);

        if (!device) {
          return NextResponse.json({
            success: false,
            error: 'Device not found',
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          deviceId: device.deviceId,
          status: device.status,
          mode: device.mode,
          topic: device.topic,
          brokerEndpoint: device.brokerEndpoint,
          brokerPort: device.brokerPort,
        });
      }

      case 'health': {
        const { deviceId } = body;

        if (!deviceId) {
          return NextResponse.json({
            success: false,
            error: 'deviceId required',
          }, { status: 400 });
        }

        const device = devices.get(deviceId);

        if (!device) {
          return NextResponse.json({
            success: false,
            error: 'Device not found',
          }, { status: 404 });
        }

        // Simulate health metrics
        return NextResponse.json({
          success: true,
          deviceId: device.deviceId,
          healthy: device.status === 'active',
          uptime: Math.floor((Date.now() - device.createdAt) / 1000),
          messagesProcessed: Math.floor(Math.random() * 10000),
          lastHeartbeat: new Date().toISOString(),
        });
      }

      case 'shutdown': {
        const { deviceId } = body;

        if (!deviceId) {
          return NextResponse.json({
            success: false,
            error: 'deviceId required',
          }, { status: 400 });
        }

        const device = devices.get(deviceId);

        if (!device) {
          return NextResponse.json({
            success: false,
            error: 'Device not found',
          }, { status: 404 });
        }

        devices.delete(deviceId);
        console.log(`[DEVICE] Shut down device: ${deviceId}`);

        return NextResponse.json({
          success: true,
          message: 'Device shut down successfully',
        });
      }

      case 'cleanup-expired': {
        // Clean up expired devices based on session expiry
        const now = Date.now();
        let cleaned = 0;

        for (const [deviceId, device] of devices.entries()) {
          if (now > device.sessionExpiry) {
            devices.delete(deviceId);
            cleaned++;
            console.log(`[DEVICE] Cleaned up expired device: ${deviceId}`);
          }
        }

        return NextResponse.json({
          success: true,
          cleaned,
        });
      }

      case 'list': {
        const { sessionId, profileKey } = body;
        
        let deviceList = Array.from(devices.values());

        if (sessionId) {
          deviceList = deviceList.filter(d => d.sessionId === sessionId);
        }

        if (profileKey) {
          deviceList = deviceList.filter(d => d.profileKey === profileKey);
        }

        return NextResponse.json({
          success: true,
          devices: deviceList.map(d => ({
            deviceId: d.deviceId,
            mode: d.mode,
            status: d.status,
            topic: d.topic,
            createdAt: d.createdAt,
          })),
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Device API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const deviceId = searchParams.get('deviceId');

  if (!deviceId) {
    // List all devices if no specific device requested
    const deviceList = Array.from(devices.values()).map(d => ({
      deviceId: d.deviceId,
      mode: d.mode,
      status: d.status,
      topic: d.topic,
      createdAt: d.createdAt,
    }));

    return NextResponse.json({
      success: true,
      devices: deviceList,
    });
  }

  const device = devices.get(deviceId);

  if (!device) {
    return NextResponse.json({
      success: false,
      error: 'Device not found',
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    device: {
      deviceId: device.deviceId,
      profileKey: device.profileKey,
      mode: device.mode,
      status: device.status,
      topic: device.topic,
      brokerEndpoint: device.brokerEndpoint,
      brokerPort: device.brokerPort,
      username: device.username,
      createdAt: device.createdAt,
    },
  });
}
