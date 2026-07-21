"use client";

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Conversation } from '@/lib/types';

interface ChartProps {
  conversations: Conversation[];
}

export function StatusDonutChart({ conversations }: ChartProps) {
  const data = useMemo(() => {
    let active = 0, escalated = 0, resolved = 0;
    
    conversations.forEach(c => {
      if (c.status === 'escalated') escalated++;
      else if (c.status === 'resolved') resolved++;
      else active++;
    });

    return [
      { name: 'Active', value: active, color: '#02c697' },
      { name: 'Resolved', value: resolved, color: '#64748b' },
      { name: 'Escalated', value: escalated, color: '#ef4444' }
    ].filter(d => d.value > 0);
  }, [conversations]);

  if (data.length === 0) {
    return <div className="w-full h-[280px] flex items-center justify-center text-textMuted text-xs font-mono">No conversation status telemetry</div>;
  }

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#11131c',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
              color: '#f8fafc',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            wrapperStyle={{ paddingTop: '10px', fontSize: '11px', color: '#94a3b8' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
