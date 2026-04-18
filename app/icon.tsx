import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
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
          background: '#3b82f6',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '128px',
        }}
      >
        <div style={{ color: 'white', fontSize: 320, fontWeight: 900, fontFamily: 'sans-serif', letterSpacing: '-0.05em' }}>
          R
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
