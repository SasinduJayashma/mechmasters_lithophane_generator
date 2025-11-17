#!/usr/bin/env node

/**
 * Lithophane Generator - Automation Script
 * Generate lithophanes from command line without UI
 *
 * Usage:
 *   node scripts/generate-lithophane.js <input-image> [output-file] [options]
 *
 * Example:
 *   node scripts/generate-lithophane.js photo.jpg lithophane.stl --quality=0.1 --smoothing=1
 */

const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

// Default settings (matching the web app defaults)
const DEFAULT_SETTINGS = {
  // Greyscale
  greyscaleMethod: 'luminance',
  redSlider: 0.299,
  greenSlider: 0.587,
  blueSlider: 0.114,
  bgIntensity: 0.5,
  threshold: 0.5,
  blackFactor: 0.5,
  whiteFactor: 0.5,

  // Image adjustments
  brightness: 0,
  contrast: 0,
  exposure: 0,
  blur: 0,

  // Cylinder parameters
  diameter: 74.2,
  diameterTop: 74.2,
  diameterBottom: 74.2,
  height: 115.6,
  angle: 360,
  minThick: 0.5,
  maxThick: 2.8,

  // Quality
  mmPerPixel: 0.1,
  smoothing: 1,

  // Model options
  positiveImage: true,
};

/**
 * Apply greyscale to image data
 */
function applyGreyscale(imageData, settings) {
  const data = new Uint8ClampedArray(imageData.data);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    let grey;

    switch (settings.greyscaleMethod) {
      case 'averaging':
        grey = 0.33 * r + 0.33 * g + 0.33 * b;
        break;
      case 'luminance':
        grey = settings.redSlider * r + settings.greenSlider * g + settings.blueSlider * b;
        break;
      case 'blackwhite':
        const avgValue = (r + g + b) / 3;
        const normalizedAvg = avgValue / 255;
        if (normalizedAvg > settings.threshold) {
          grey = Math.min(255, avgValue + (255 - avgValue) * settings.whiteFactor);
        } else {
          grey = Math.max(0, avgValue - avgValue * settings.blackFactor);
        }
        break;
    }

    // Apply background intensity for transparent pixels
    if (a < 255) {
      const alpha = a / 255;
      const bgValue = settings.bgIntensity * 255;
      grey = grey * alpha + bgValue * (1 - alpha);
    }

    data[i] = grey;
    data[i + 1] = grey;
    data[i + 2] = grey;
    data[i + 3] = 255;
  }

  return { data, width: imageData.width, height: imageData.height };
}

/**
 * Apply smoothing to thickness grid
 */
function smoothThicknessValues(thicknessGrid, smoothing) {
  if (smoothing === 0) return thicknessGrid;

  const rows = thicknessGrid.length;
  const cols = thicknessGrid[0]?.length || 0;

  let smoothed = thicknessGrid.map(row => [...row]);

  for (let iter = 0; iter < smoothing; iter++) {
    const temp = smoothed.map(row => [...row]);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        let sum = 0;
        let weight = 0;

        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            const ni = i + di;
            const nj = j + dj;

            if (ni >= 0 && ni < rows && nj >= 0 && nj < cols) {
              let w;
              if (di === 0 && dj === 0) {
                w = 4;
              } else if (di === 0 || dj === 0) {
                w = 2;
              } else {
                w = 1;
              }

              sum += smoothed[ni][nj] * w;
              weight += w;
            }
          }
        }

        temp[i][j] = sum / weight;
      }
    }

    smoothed = temp;
  }

  return smoothed;
}

/**
 * Generate Binary STL for cylinder lithophane
 */
function generateCylinderLithophane(imageData, settings) {
  const { width, height, data } = imageData;
  const params = settings;

  // Calculate parameters
  const radiusBottom = params.diameterBottom / 2;
  const radiusTop = params.diameterTop / 2;
  const cylinderHeight = params.height;
  const angleRad = (params.angle * Math.PI) / 180;

  // Calculate segments
  const circumference = Math.PI * params.diameter * (params.angle / 360);
  const segmentsW = Math.floor(circumference / params.mmPerPixel);
  const segmentsH = Math.floor(params.height / params.mmPerPixel);

  console.log(`Generating lithophane with ${segmentsW} x ${segmentsH} segments...`);

  // Step 1: Build thickness grid
  const thicknessGrid = [];
  for (let row = 0; row <= segmentsH; row++) {
    thicknessGrid[row] = [];
    const v = row / segmentsH;

    for (let col = 0; col <= segmentsW; col++) {
      const u = col / segmentsW;

      const imgX = Math.floor(u * (width - 1));
      const imgY = Math.floor(v * (height - 1));
      const idx = (imgY * width + imgX) * 4;

      let greyValue = data[idx] / 255;

      if (!params.positiveImage) {
        greyValue = 1 - greyValue;
      }

      const thickness = params.minThick + greyValue * (params.maxThick - params.minThick);
      thicknessGrid[row][col] = thickness;
    }
  }

  // Step 2: Apply smoothing
  const smoothedGrid = smoothThicknessValues(thicknessGrid, params.smoothing);

  // Step 3: Create vertices
  const vertices = [];
  for (let row = 0; row <= segmentsH; row++) {
    vertices[row] = [];
    const v = row / segmentsH;
    const y = cylinderHeight * v - cylinderHeight / 2;
    const radius = radiusBottom + (radiusTop - radiusBottom) * v;

    for (let col = 0; col <= segmentsW; col++) {
      const u = col / segmentsW;
      const angle = angleRad * u;
      const thickness = smoothedGrid[row][col];

      const x = (radius + thickness) * Math.cos(angle);
      const z = (radius + thickness) * Math.sin(angle);

      vertices[row][col] = { x, y, z };
    }
  }

  // Step 4: Generate triangles
  const triangles = [];

  // Main surface
  for (let row = 0; row < segmentsH; row++) {
    for (let col = 0; col < segmentsW; col++) {
      const v1 = vertices[row][col];
      const v2 = vertices[row][col + 1];
      const v3 = vertices[row + 1][col + 1];
      const v4 = vertices[row + 1][col];

      triangles.push([v1, v2, v3]);
      triangles.push([v1, v3, v4]);
    }
  }

  // Caps for partial cylinders
  if (params.angle < 360) {
    for (let row = 0; row < segmentsH; row++) {
      const v1 = { x: 0, y: vertices[row][0].y, z: 0 };
      const v2 = vertices[row][0];
      const v3 = vertices[row + 1][0];
      const v4 = { x: 0, y: vertices[row + 1][0].y, z: 0 };

      triangles.push([v1, v3, v2]);
      triangles.push([v1, v4, v3]);
    }

    for (let row = 0; row < segmentsH; row++) {
      const v1 = { x: 0, y: vertices[row][segmentsW].y, z: 0 };
      const v2 = vertices[row][segmentsW];
      const v3 = vertices[row + 1][segmentsW];
      const v4 = { x: 0, y: vertices[row + 1][segmentsW].y, z: 0 };

      triangles.push([v1, v2, v3]);
      triangles.push([v1, v3, v4]);
    }
  }

  // Top and bottom caps
  const centerBottom = { x: 0, y: -cylinderHeight / 2, z: 0 };
  for (let col = 0; col < segmentsW; col++) {
    const v1 = centerBottom;
    const v2 = vertices[0][col];
    const v3 = vertices[0][col + 1];
    triangles.push([v1, v3, v2]);
  }

  const centerTop = { x: 0, y: cylinderHeight / 2, z: 0 };
  for (let col = 0; col < segmentsW; col++) {
    const v1 = centerTop;
    const v2 = vertices[segmentsH][col];
    const v3 = vertices[segmentsH][col + 1];
    triangles.push([v1, v2, v3]);
  }

  console.log(`Generated ${triangles.length} triangles`);

  // Step 5: Generate Binary STL
  return generateBinarySTL(triangles);
}

/**
 * Generate binary STL buffer
 */
function generateBinarySTL(triangles) {
  const triangleCount = triangles.length;
  const bufferSize = 80 + 4 + (triangleCount * 50);
  const buffer = Buffer.alloc(bufferSize);

  let offset = 0;

  // Header
  buffer.write('Lithophane Generator - CLI', offset, 'ascii');
  offset += 80;

  // Triangle count
  buffer.writeUInt32LE(triangleCount, offset);
  offset += 4;

  // Triangles
  for (const triangle of triangles) {
    const [v1, v2, v3] = triangle;

    // Calculate normal
    const u = { x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z };
    const v = { x: v3.x - v1.x, y: v3.y - v1.y, z: v3.z - v1.z };
    const normal = {
      x: u.y * v.z - u.z * v.y,
      y: u.z * v.x - u.x * v.z,
      z: u.x * v.y - u.y * v.x,
    };
    const length = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
    normal.x /= length;
    normal.y /= length;
    normal.z /= length;

    // Normal
    buffer.writeFloatLE(normal.x, offset); offset += 4;
    buffer.writeFloatLE(normal.y, offset); offset += 4;
    buffer.writeFloatLE(normal.z, offset); offset += 4;

    // Vertices
    buffer.writeFloatLE(v1.x, offset); offset += 4;
    buffer.writeFloatLE(v1.y, offset); offset += 4;
    buffer.writeFloatLE(v1.z, offset); offset += 4;
    buffer.writeFloatLE(v2.x, offset); offset += 4;
    buffer.writeFloatLE(v2.y, offset); offset += 4;
    buffer.writeFloatLE(v2.z, offset); offset += 4;
    buffer.writeFloatLE(v3.x, offset); offset += 4;
    buffer.writeFloatLE(v3.y, offset); offset += 4;
    buffer.writeFloatLE(v3.z, offset); offset += 4;

    // Attribute
    buffer.writeUInt16LE(0, offset);
    offset += 2;
  }

  return buffer;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node generate-lithophane.js <input-image> [output-file] [options]');
    console.log('');
    console.log('Options:');
    console.log('  --quality=<mm>        mm per pixel (default: 0.1)');
    console.log('  --smoothing=<level>   0-5 (default: 1)');
    console.log('  --diameter=<mm>       cylinder diameter (default: 74.2)');
    console.log('  --height=<mm>         cylinder height (default: 115.6)');
    console.log('  --min-thick=<mm>      min thickness (default: 0.5)');
    console.log('  --max-thick=<mm>      max thickness (default: 2.8)');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] && !args[1].startsWith('--') ? args[1] : 'lithophane.stl';

  // Parse options
  const settings = { ...DEFAULT_SETTINGS };
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      switch (key) {
        case 'quality':
          settings.mmPerPixel = parseFloat(value);
          break;
        case 'smoothing':
          settings.smoothing = parseInt(value);
          break;
        case 'diameter':
          settings.diameter = settings.diameterTop = settings.diameterBottom = parseFloat(value);
          break;
        case 'height':
          settings.height = parseFloat(value);
          break;
        case 'min-thick':
          settings.minThick = parseFloat(value);
          break;
        case 'max-thick':
          settings.maxThick = parseFloat(value);
          break;
      }
    }
  });

  console.log(`Loading image: ${inputFile}`);
  const image = await loadImage(inputFile);

  console.log(`Image size: ${image.width} x ${image.height}`);

  // Create canvas and get image data
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  const rawImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Apply greyscale
  console.log('Applying greyscale...');
  const greyImageData = applyGreyscale(rawImageData, settings);

  // Generate lithophane
  console.log('Generating lithophane...');
  const stlBuffer = generateCylinderLithophane(greyImageData, settings);

  // Save STL
  console.log(`Saving STL: ${outputFile}`);
  fs.writeFileSync(outputFile, stlBuffer);

  const fileSizeMB = (stlBuffer.length / (1024 * 1024)).toFixed(2);
  console.log(`✓ Done! File size: ${fileSizeMB} MB`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
