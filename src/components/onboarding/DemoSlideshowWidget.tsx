'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Gauge, 
  BarChart3, 
  Bell, 
  Zap,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Slide {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const SLIDES: Slide[] = [
  {
    icon: Zap,
    title: 'Demo Machine',
    description: 'This is a simulated industrial machine that generates realistic telemetry data including temperature, pressure, vibration, and cycle metrics.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Gauge,
    title: 'Real-Time Health Score',
    description: 'Watch the AI calculate a health score based on your machine\'s vital signs. The score updates in real-time as new data arrives.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Activity,
    title: 'Live Telemetry',
    description: 'See sensor data streaming in real-time. Temperature, pressure, vibration, and other metrics are visualized on your dashboard.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: TrendingUp,
    title: 'Predictive Analytics',
    description: 'Our AI learns your machine\'s patterns and predicts maintenance needs before issues occur, reducing downtime and costs.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Get notified when anomalies are detected. The system automatically creates tickets and alerts you about potential issues.',
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: BarChart3,
    title: 'Interactive Dashboard',
    description: 'Explore your data with interactive charts. Ask questions in natural language and the AI will help you understand your machine.',
    color: 'from-indigo-500 to-violet-500',
  },
];

interface DemoSlideshowWidgetProps {
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export function DemoSlideshowWidget({ 
  autoPlay = true, 
  autoPlayInterval = 5000 
}: DemoSlideshowWidgetProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [autoPlay, autoPlayInterval]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="rounded-xl border border-purple-200 bg-white overflow-hidden shadow-sm">
      {/* Slide Content */}
      <div className="relative h-48">
        {/* Background Gradient */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-10',
          slide.color.replace('from-', 'from-').replace('to-', 'to-')
        )} />
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={cn(
            'absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-br opacity-20 blur-2xl',
            slide.color
          )} />
          <div className={cn(
            'absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl',
            slide.color
          )} />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
          <div className={cn(
            'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg',
            slide.color
          )}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{slide.title}</h3>
          <p className="mt-2 text-sm text-slate-600 max-w-sm leading-relaxed">
            {slide.description}
          </p>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow hover:bg-white transition"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow hover:bg-white transition"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex items-center justify-center gap-1.5 py-3 border-t border-slate-100">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              'h-2 rounded-full transition-all',
              index === currentSlide
                ? 'w-6 bg-purple-600'
                : 'w-2 bg-slate-300 hover:bg-slate-400'
            )}
          />
        ))}
      </div>
    </div>
  );
}
