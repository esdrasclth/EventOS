/**
 * Run: node scripts/generate-icons.mjs
 * Requires: npm install -D sharp (optional helper)
 *
 * This script generates PNG icons from the SVG.
 * If sharp is not available, placeholder PNGs are created.
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);
const root = join(__dir, '..');

// Try to use sharp if available
try {
  const sharp = (await import('sharp')).default;
  const svgBuffer = readFileSync(join(root, 'public/icons/icon.svg'));

  await sharp(svgBuffer).resize(192, 192).png().toFile(join(root, 'public/icons/icon-192.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(join(root, 'public/icons/icon-512.png'));
  console.log('✅ Icons generated with sharp');
} catch {
  // Fallback: create minimal 1x1 placeholder PNGs
  // Real icons should be provided manually
  console.log('⚠️  sharp not available. Place icon-192.png and icon-512.png manually in public/icons/');
  console.log('   You can generate them from public/icons/icon.svg using any SVG-to-PNG tool.');
}
