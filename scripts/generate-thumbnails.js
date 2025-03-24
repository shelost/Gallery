import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Configuration
const THUMBNAIL_QUALITY = 50;  // Lower quality for thumbnails
const THUMBNAIL_WIDTH = 300;   // Small width for fast loading

// Base directory for all mini images
const MINI_BASE_DIR = 'static/@minified';

// Image directories to process with their corresponding mini destinations
const imageDirectories = [
  {
    src: 'static/card',
    miniPath: `${MINI_BASE_DIR}/card`
  },
  {
    src: 'static/bento',
    miniPath: `${MINI_BASE_DIR}/bento`
  },
  {
    src: 'static',
    miniPath: MINI_BASE_DIR,
    exclude: ['card', 'bento', 'audio', 'video', 'icon', '@minified']
  }
];

// Process images in the given directory
async function processDirectory(dir, miniDir, options = {}) {
  const { exclude = [] } = options;

  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    // Skip directories in exclude list
    if (file.isDirectory() && exclude.includes(file.name)) {
      console.log(`Skipping excluded directory: ${file.name}`);
      continue;
    }

    // Process directories recursively
    if (file.isDirectory() && file.name !== '@minified') {
      const subDir = path.join(dir, file.name);
      const subMiniDir = path.join(miniDir, file.name);

      if (!fs.existsSync(subMiniDir)) {
        fs.mkdirSync(subMiniDir, { recursive: true });
      }

      await processDirectory(subDir, subMiniDir, options);
      continue;
    }

    // Skip non-image files
    const fileExt = path.extname(file.name).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(fileExt)) {
      continue;
    }

    const srcPath = path.join(dir, file.name);
    const miniPath = path.join(miniDir, file.name);

    // Skip if mini image already exists and is newer than the source
    if (fs.existsSync(miniPath)) {
      const srcStat = fs.statSync(srcPath);
      const miniStat = fs.statSync(miniPath);

      if (miniStat.mtime > srcStat.mtime) {
        console.log(`Skipping up-to-date mini image: ${miniPath}`);
        continue;
      }
    }

    try {
      console.log(`Generating mini image: ${miniPath}`);

      await sharp(srcPath)
        .resize({ width: THUMBNAIL_WIDTH })
        .jpeg({ quality: THUMBNAIL_QUALITY })
        .toFile(miniPath);
    } catch (error) {
      console.error(`Error processing ${srcPath}:`, error);
    }
  }
}

// Main function to process all image directories
async function main() {
  // Create the base mini directory
  if (!fs.existsSync(MINI_BASE_DIR)) {
    fs.mkdirSync(MINI_BASE_DIR, { recursive: true });
  }

  for (const { src, miniPath, exclude } of imageDirectories) {
    if (!fs.existsSync(src)) {
      console.log(`Source directory not found: ${src}`);
      continue;
    }

    if (!fs.existsSync(miniPath)) {
      fs.mkdirSync(miniPath, { recursive: true });
    }

    console.log(`Processing images in ${src}...`);
    await processDirectory(src, miniPath, { exclude });
  }

  console.log('Mini image generation complete!');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});