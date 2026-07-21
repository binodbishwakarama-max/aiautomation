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
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        dateStr: format(date, 'yyyy-MM-dd'),
        display: format(date, 'MMM d'),
        count: 0
      };
    });

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
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#02c697" stopOpacity={0.35}/>
              <stop offset="95%" stopColor="#02c697" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis 
            dataKey="display" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            dy={8}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#11131c',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
              color: '#f8fafc',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
            }}
            itemStyle={{ color: '#02c697', fontWeight: 600 }}
          />
          <Area 
            type="monotone" 
            dataKey="count" 
            name="Conversations"
            stroke="#02c697" 
            strokeWidth={2.5}
            fillOpacity={1} 
            fill="url(#colorCount)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
