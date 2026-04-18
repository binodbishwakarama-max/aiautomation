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
      else active++; // defaults 'new' 'active' 'followed_up' to active
    });

    return [
      { name: 'Active', value: active, color: '#4ADE80' }, // green-400
      { name: 'Resolved', value: resolved, color: '#9CA3AF' }, // gray-400
      { name: 'Escalated', value: escalated, color: '#EF4444' } // red-500
    ].filter(d => d.value > 0);
  }, [conversations]);

  if (data.length === 0) {
    return <div className="w-full h-[300px] flex items-center justify-center text-textMuted text-sm">No data yet</div>;
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--surface))',
              borderColor: 'hsl(var(--border))',
              borderRadius: '0.5rem',
              color: 'hsl(var(--text-primary))'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
