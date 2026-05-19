/**
 * Generates Android and iOS app icons from a single source image.
 * Usage: node scripts/generate-app-icon.js [path-to-icon]
 * Default source: app-icon.png in project root
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const sourceImage = path.resolve(projectRoot, process.argv[2] || 'app-icon.png');

// Android mipmap sizes (px): mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi
const ANDROID_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// iOS AppIcon sizes: { filename: pixelSize }
const IOS_ICONS = [
  { filename: 'Icon-App-20x20@2x.png', size: 40 },
  { filename: 'Icon-App-20x20@3x.png', size: 60 },
  { filename: 'Icon-App-29x29@2x.png', size: 58 },
  { filename: 'Icon-App-29x29@3x.png', size: 87 },
  { filename: 'Icon-App-40x40@2x.png', size: 80 },
  { filename: 'Icon-App-40x40@3x.png', size: 120 },
  { filename: 'Icon-App-60x60@2x.png', size: 120 },
  { filename: 'Icon-App-60x60@3x.png', size: 180 },
  { filename: 'Icon-App-1024x1024.png', size: 1024 },
];

const IOS_CONTENTS = {
  images: [
    { idiom: 'iphone', scale: '2x', size: '20x20', filename: 'Icon-App-20x20@2x.png' },
    { idiom: 'iphone', scale: '3x', size: '20x20', filename: 'Icon-App-20x20@3x.png' },
    { idiom: 'iphone', scale: '2x', size: '29x29', filename: 'Icon-App-29x29@2x.png' },
    { idiom: 'iphone', scale: '3x', size: '29x29', filename: 'Icon-App-29x29@3x.png' },
    { idiom: 'iphone', scale: '2x', size: '40x40', filename: 'Icon-App-40x40@2x.png' },
    { idiom: 'iphone', scale: '3x', size: '40x40', filename: 'Icon-App-40x40@3x.png' },
    { idiom: 'iphone', scale: '2x', size: '60x60', filename: 'Icon-App-60x60@2x.png' },
    { idiom: 'iphone', scale: '3x', size: '60x60', filename: 'Icon-App-60x60@3x.png' },
    { idiom: 'ios-marketing', scale: '1x', size: '1024x1024', filename: 'Icon-App-1024x1024.png' },
  ],
  info: { author: 'xcode', version: 1 },
};

async function main() {
  if (!fs.existsSync(sourceImage)) {
    console.error('Source image not found:', sourceImage);
    process.exit(1);
  }

  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('Run: npm install --save-dev sharp');
    process.exit(1);
  }

  const image = sharp(sourceImage);

  // Android
  const androidRes = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');
  for (const [folder, size] of Object.entries(ANDROID_SIZES)) {
    const dir = path.join(androidRes, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const buf = await image.clone().resize(size, size).png().toBuffer();
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), buf);
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), buf);
  }
  console.log('Android icons written to', androidRes);

  // iOS
  const iosIconSet = path.join(projectRoot, 'ios', 'RNBoilerplate', 'Images.xcassets', 'AppIcon.appiconset');
  if (!fs.existsSync(iosIconSet)) fs.mkdirSync(iosIconSet, { recursive: true });
  for (const { filename, size } of IOS_ICONS) {
    const buf = await image.clone().resize(size, size).png().toBuffer();
    fs.writeFileSync(path.join(iosIconSet, filename), buf);
  }
  fs.writeFileSync(
    path.join(iosIconSet, 'Contents.json'),
    JSON.stringify(IOS_CONTENTS, null, 2)
  );
  console.log('iOS AppIcon set written to', iosIconSet);
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
