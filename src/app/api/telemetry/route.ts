import { NextRequest, NextResponse } from "next/server";

// Generate realistic telemetry data for a machine
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const machineId = searchParams.get("machineId") || "m456";
  const channelCount = parseInt(searchParams.get("channels") || "14");
  const points = parseInt(searchParams.get("points") || "30");

  // Define channel configurations with different bounds and characteristics
  const channelConfigs = [
    { name: "Temperature", unit: "°C", baseline: 72, range: 8, lowerBound: 65, upperBound: 85, volatility: 0.3 },
    { name: "Pressure", unit: "kPa", baseline: 420, range: 25, lowerBound: 380, upperBound: 460, volatility: 0.4 },
    { name: "Vibration X", unit: "mm/s", baseline: 2.8, range: 0.6, lowerBound: 2.0, upperBound: 4.0, volatility: 0.5 },
    { name: "Vibration Y", unit: "mm/s", baseline: 2.6, range: 0.5, lowerBound: 2.0, upperBound: 3.8, volatility: 0.5 },
    { name: "Vibration Z", unit: "mm/s", baseline: 3.1, range: 0.7, lowerBound: 2.2, upperBound: 4.2, volatility: 0.5 },
    { name: "Torque", unit: "Nm", baseline: 156, range: 18, lowerBound: 135, upperBound: 180, volatility: 0.35 },
    { name: "Speed", unit: "RPM", baseline: 1450, range: 80, lowerBound: 1350, upperBound: 1600, volatility: 0.25 },
    { name: "Current", unit: "A", baseline: 28, range: 4, lowerBound: 22, upperBound: 35, volatility: 0.3 },
    { name: "Voltage", unit: "V", baseline: 230, range: 8, lowerBound: 220, upperBound: 242, volatility: 0.2 },
    { name: "Power", unit: "kW", baseline: 6.4, range: 1.2, lowerBound: 5.0, upperBound: 8.0, volatility: 0.35 },
    { name: "Flow Rate", unit: "L/min", baseline: 45, range: 6, lowerBound: 38, upperBound: 54, volatility: 0.3 },
    { name: "Coolant Temp", unit: "°C", baseline: 32, range: 4, lowerBound: 28, upperBound: 38, volatility: 0.25 },
    { name: "Oil Pressure", unit: "bar", baseline: 4.2, range: 0.5, lowerBound: 3.5, upperBound: 5.0, volatility: 0.3 },
    { name: "Humidity", unit: "%", baseline: 52, range: 8, lowerBound: 40, upperBound: 65, volatility: 0.2 },
  ];

  const now = Date.now();
  const interval = 2000; // 2 seconds between points

  const channels = channelConfigs.slice(0, channelCount).map((config, idx) => {
    const channelId = `ch${idx + 1}`;
    
    // Generate time series data with realistic patterns
    const data: Array<{ timestamp: number; value: number; lowerBound: number; upperBound: number }> = [];
    let currentValue = config.baseline;
    
    for (let i = 0; i < points; i++) {
      const timestamp = now - (points - i) * interval;
      
      // Add some random walk behavior
      const randomChange = (Math.random() - 0.5) * config.range * config.volatility;
      currentValue += randomChange;
      
      // Keep value mostly within healthy range but allow occasional excursions
      const healthyMin = config.lowerBound + (config.upperBound - config.lowerBound) * 0.15;
      const healthyMax = config.upperBound - (config.upperBound - config.lowerBound) * 0.15;
      
      // 85% chance to drift back toward healthy zone
      if (currentValue < healthyMin && Math.random() > 0.15) {
        currentValue += Math.abs(randomChange) * 0.5;
      } else if (currentValue > healthyMax && Math.random() > 0.15) {
        currentValue -= Math.abs(randomChange) * 0.5;
      }
      
      // Hard clamp to bounds (rare breach)
      currentValue = Math.max(config.lowerBound - config.range * 0.1, 
                              Math.min(config.upperBound + config.range * 0.1, currentValue));
      
      data.push({
        timestamp,
        value: parseFloat(currentValue.toFixed(2)),
        lowerBound: config.lowerBound,
        upperBound: config.upperBound,
      });
    }

    // Calculate health score for this channel (0-100)
    const healthScore = data.reduce((acc, point) => {
      const normalizedPos = (point.value - point.lowerBound) / (point.upperBound - point.lowerBound);
      // Ideal is center (0.5), score decreases as we approach bounds
      const distance = Math.abs(normalizedPos - 0.5);
      const pointScore = Math.max(0, 100 - distance * 200);
      return acc + pointScore;
    }, 0) / data.length;

    return {
      channelId,
      name: config.name,
      unit: config.unit,
      data,
      currentValue: data[data.length - 1].value,
      lowerBound: config.lowerBound,
      upperBound: config.upperBound,
      healthScore: Math.round(healthScore),
      status: healthScore > 85 ? "healthy" : healthScore > 60 ? "warning" : "critical",
    };
  });

  // Calculate overall health score (weighted average)
  const overallHealthScore = Math.round(
    channels.reduce((acc, ch) => acc + ch.healthScore, 0) / channels.length
  );

  return NextResponse.json({
    machineId,
    timestamp: now,
    overallHealthScore,
    channels,
  });
}
