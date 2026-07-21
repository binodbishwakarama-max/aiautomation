import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 512,
  height: 512,
};
export const contentType = 'image/png';

export default function Icon() {
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
          padding: '32px',
        }}
      >
        {/* High-DPI Squircle Icon Container */}
        <div
          style={{
            background: '#131F24',
            width: '448px',
            height: '448px',
            borderRadius: '96px',
            border: '2px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
          }}
        >
          {/* Möbius Sync Node Icon SVG */}
          <svg
            width="280"
            height="280"
            viewBox="0 0 32 32"
            fill="none"
          >
            <path
              d="M10 16C10 12.6863 12.6863 10 16 10C19.3137 10 22 12.6863 22 16C22 19.3137 24.6863 22 28 22C31.3137 22 34 19.3137 34 16"
              stroke="#00E599"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M22 16C22 19.3137 19.3137 22 16 22C12.6863 22 10 19.3137 10 16C10 12.6863 7.31371 10 4 10C0.686291 10 -2 12.6863 -2 16"
              stroke="#06B6D4"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="16" cy="16" r="3" fill="#00E599" />
          </svg>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
