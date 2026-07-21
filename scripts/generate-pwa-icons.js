const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Standard SVG Icon (Full bleed inside dark squircle)
const svgStandard = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0B1215" />
  <rect x="24" y="24" width="464" height="464" rx="120" fill="#131F24" stroke="rgba(255, 255, 255, 0.15)" stroke-width="16" />
  <circle cx="192" cy="256" r="80" stroke="#00E599" stroke-width="36" fill="none" />
  <circle cx="320" cy="256" r="80" stroke="#06B6D4" stroke-width="36" fill="none" />
  <circle cx="256" cy="256" r="28" fill="#00E599" />
</svg>
`;

// 2. Maskable SVG Icon (Safe zone compliant - 10% padding so icons don't get cropped on Android adaptive launchers)
const svgMaskable = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0B1215" />
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <rect x="24" y="24" width="464" height="464" rx="120" fill="#131F24" stroke="rgba(255, 255, 255, 0.15)" stroke-width="16" />
    <circle cx="192" cy="256" r="80" stroke="#00E599" stroke-width="36" fill="none" />
    <circle cx="320" cy="256" r="80" stroke="#06B6D4" stroke-width="36" fill="none" />
    <circle cx="256" cy="256" r="28" fill="#00E599" />
  </g>
</svg>
`;

async function generateIcons() {
  console.log('Generating PWA physical PNG icons...');

  // Generate 192x192 standard
  await sharp(Buffer.from(svgStandard))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192x192.png'));
  console.log('✔ Generated public/icons/icon-192x192.png');

  // Generate 512x512 standard
  await sharp(Buffer.from(svgStandard))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512x512.png'));
  console.log('✔ Generated public/icons/icon-512x512.png');

  // Generate 192x192 maskable
  await sharp(Buffer.from(svgMaskable))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'maskable-icon-192x192.png'));
  console.log('✔ Generated public/icons/maskable-icon-192x192.png');

  // Generate 512x512 maskable
  await sharp(Buffer.from(svgMaskable))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'maskable-icon-512x512.png'));
  console.log('✔ Generated public/icons/maskable-icon-512x512.png');

  // Generate Apple Touch Icon (180x180)
  await sharp(Buffer.from(svgStandard))
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('✔ Generated public/icons/apple-touch-icon.png');

  // Generate Favicon (32x32)
  await sharp(Buffer.from(svgStandard))
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '../public/favicon.png'));
  console.log('✔ Generated public/favicon.png');

  console.log('All PWA physical icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating PWA icons:', err);
  process.exit(1);
});
