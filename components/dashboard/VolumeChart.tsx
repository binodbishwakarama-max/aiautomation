"use client";

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format, subDays } from 'date-fns';
import { Conversation } from '@/lib/types';

interface ChartProps {
  conversations: Conversation[];
}

export function VolumeChart({ conversations }: ChartProps) {
  const data = useMemo(() => {
    // Generate an array of the last 7 days
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        dateStr: format(date, 'yyyy-MM-dd'),
        display: format(date, 'MMM d'),
        count: 0
      };
    });

    // Populate counts
    conversations.forEach(c => {
      if (!c.last_message_at) return;
      const dateStr = format(new Date(c.last_message_at), 'yyyy-MM-dd');
      const dayData = last7Days.find(d => d.dateStr === dateStr);
      if (dayData) {
        dayData.count += 1;
      }
    });

    return last7Days;
  }, [conversations]);

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
          <XAxis 
            dataKey="display" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--text-muted))' }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--text-muted))' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--surface))',
              borderColor: 'hsl(var(--border))',
              borderRadius: '0.5rem',
              color: 'hsl(var(--text-primary))'
            }}
            itemStyle={{ color: 'hsl(var(--primary))' }}
          />
          <Area 
            type="monotone" 
            dataKey="count" 
            name="Conversations"
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorCount)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
