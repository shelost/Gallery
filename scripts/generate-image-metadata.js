import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATIC_DIR = path.join(__dirname, '..', 'static');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'lib', 'imageMetadata.json');

// Directories to process
const IMAGE_DIRS = ['card', 'bento'];

async function generateImageMetadata() {
	const metadata = {};

	for (const dir of IMAGE_DIRS) {
		const dirPath = path.join(STATIC_DIR, dir);

		if (!fs.existsSync(dirPath)) {
			console.log(`Directory ${dir} not found, skipping...`);
			continue;
		}

		const files = fs.readdirSync(dirPath).filter(file =>
			file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.svg')
		);

		metadata[dir] = {};

		for (const file of files) {
			const filePath = path.join(dirPath, file);
			const fileKey = path.parse(file).name;

			try {
				if (file.endsWith('.svg')) {
					// For SVG files, just store the path
					metadata[dir][fileKey] = {
						src: `/${dir}/${file}`,
						type: 'svg'
					};
				} else {
					// For raster images, generate metadata and placeholder
					const image = sharp(filePath);
					const info = await image.metadata();

					// Generate a tiny base64 placeholder (10px width)
					const placeholder = await image
						.resize(10, Math.round(10 * info.height / info.width))
						.blur(5)
						.toBuffer();

					const base64Placeholder = `data:image/${info.format};base64,${placeholder.toString('base64')}`;

					metadata[dir][fileKey] = {
						src: `/${dir}/${file}`,
						width: info.width,
						height: info.height,
						placeholder: base64Placeholder,
						type: 'raster'
					};

					console.log(`Processed ${dir}/${file}`);
				}
			} catch (error) {
				console.error(`Error processing ${file}:`, error);
			}
		}
	}

	// Write metadata to file
	fs.writeFileSync(OUTPUT_FILE, JSON.stringify(metadata, null, 2));
	console.log(`\nImage metadata saved to ${OUTPUT_FILE}`);
}

// Function to optimize images and create WebP versions
async function optimizeImages() {
	for (const dir of IMAGE_DIRS) {
		const dirPath = path.join(STATIC_DIR, dir);
		const optimizedDir = path.join(dirPath, 'optimized');

		if (!fs.existsSync(dirPath)) {
			continue;
		}

		// Create optimized directory if it doesn't exist
		if (!fs.existsSync(optimizedDir)) {
			fs.mkdirSync(optimizedDir, { recursive: true });
		}

		const files = fs.readdirSync(dirPath).filter(file =>
			(file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) &&
			!file.includes('optimized')
		);

		for (const file of files) {
			const filePath = path.join(dirPath, file);
			const fileName = path.parse(file).name;

			try {
				// Create optimized PNG/JPEG
				await sharp(filePath)
					.resize(800, null, {
						withoutEnlargement: true,
						fit: 'inside'
					})
					.jpeg({ quality: 85, progressive: true })
					.toFile(path.join(optimizedDir, `${fileName}.jpg`));

				// Create WebP version
				await sharp(filePath)
					.resize(800, null, {
						withoutEnlargement: true,
						fit: 'inside'
					})
					.webp({ quality: 85 })
					.toFile(path.join(optimizedDir, `${fileName}.webp`));

				console.log(`Optimized ${dir}/${file}`);
			} catch (error) {
				console.error(`Error optimizing ${file}:`, error);
			}
		}
	}
}

// Run both functions
(async () => {
	console.log('Generating image metadata...\n');
	await generateImageMetadata();

	console.log('\n\nOptimizing images...\n');
	await optimizeImages();

	console.log('\n\nDone!');
})();
