const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function fixScreenshots() {
  const desktopSrc = path.join(__dirname, 'public', 'screenshots', 'desktop.png');
  const mobileSrc = path.join(__dirname, 'public', 'screenshots', 'mobile.png');

  // We know they are currently 1024x1024 JPEGs. 
  // Let's crop desktop to 1024x576 (wide)
  await sharp(desktopSrc)
    .resize(1024, 576, { fit: 'cover', position: 'top' })
    .toFormat('png')
    .toFile(path.join(__dirname, 'public', 'screenshots', 'desktop-fixed.png'));

  // Let's crop mobile to 576x1024 (narrow)
  await sharp(mobileSrc)
    .resize(576, 1024, { fit: 'cover', position: 'center' })
    .toFormat('png')
    .toFile(path.join(__dirname, 'public', 'screenshots', 'mobile-fixed.png'));

  // Replace old files
  fs.renameSync(path.join(__dirname, 'public', 'screenshots', 'desktop-fixed.png'), desktopSrc);
  fs.renameSync(path.join(__dirname, 'public', 'screenshots', 'mobile-fixed.png'), mobileSrc);

  console.log("Screenshots fixed and converted to valid PNGs with correct aspect ratios.");
}

fixScreenshots().catch(console.error);
