import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0B1215',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
        }}
      >
        {/* iOS Apple Touch Squircle Container */}
        <div
          style={{
            background: '#131F24',
            width: '156px',
            height: '156px',
            borderRadius: '34px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Möbius Sync Node Icon SVG */}
          <svg
            width="100"
            height="100"
            viewBox="0 0 32 32"
            fill="none"
          >
            <circle
              cx="12"
              cy="16"
              r="5"
              stroke="#00E599"
              strokeWidth="2.5"
              fill="none"
            />
            <circle
              cx="20"
              cy="16"
              r="5"
              stroke="#06B6D4"
              strokeWidth="2.5"
              fill="none"
            />
            <circle cx="16" cy="16" r="1.8" fill="#00E599" />
          </svg>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
