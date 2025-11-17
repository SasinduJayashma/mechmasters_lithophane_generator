import { CylinderParams, ModelOptions } from '../store';
import { smoothThicknessValues } from './smoothing';

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Triangle {
  vertices: [Vector3, Vector3, Vector3];
  normal: Vector3;
}

function calculateNormal(v1: Vector3, v2: Vector3, v3: Vector3): Vector3 {
  const u = {
    x: v2.x - v1.x,
    y: v2.y - v1.y,
    z: v2.z - v1.z,
  };
  const v = {
    x: v3.x - v1.x,
    y: v3.y - v1.y,
    z: v3.z - v1.z,
  };

  const normal = {
    x: u.y * v.z - u.z * v.y,
    y: u.z * v.x - u.x * v.z,
    z: u.x * v.y - u.y * v.x,
  };

  const length = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
  return {
    x: normal.x / length,
    y: normal.y / length,
    z: normal.z / length,
  };
}

export function generateCylinderLithophane(
  imageData: ImageData,
  params: CylinderParams,
  options: ModelOptions,
  mmPerPixel: number = 0.1,
  smoothing: number = 1
): ArrayBuffer {
  const { width, height, data } = imageData;
  const triangles: Triangle[] = [];

  // Calculate parameters
  const radiusBottom = params.diameterBottom / 2;
  const radiusTop = params.diameterTop / 2;
  const cylinderHeight = params.height;
  const angleRad = (params.angle * Math.PI) / 180;

  // Calculate segments based on mm per pixel setting
  const circumference = Math.PI * params.diameter * (params.angle / 360);
  const segmentsW = Math.floor(circumference / mmPerPixel);
  const segmentsH = Math.floor(params.height / mmPerPixel);

  // Step 1: Build thickness grid from image data
  const thicknessGrid: number[][] = [];
  for (let row = 0; row <= segmentsH; row++) {
    thicknessGrid[row] = [];
    const v = row / segmentsH;

    for (let col = 0; col <= segmentsW; col++) {
      const u = col / segmentsW;

      // Sample image
      const imgX = Math.floor(u * (width - 1));
      const imgY = Math.floor(v * (height - 1));
      const idx = (imgY * width + imgX) * 4;

      // Get greyscale value (all channels should be equal after greyscale processing)
      let greyValue = data[idx] / 255;

      // Apply image transformations
      if (!options.positiveImage) {
        greyValue = 1 - greyValue;
      }

      // Map greyscale to thickness (darker = thinner, lighter = thicker)
      const thickness = params.minThick + greyValue * (params.maxThick - params.minThick);
      thicknessGrid[row][col] = thickness;
    }
  }

  // Step 2: Apply smoothing to reduce spikes
  const smoothedGrid = smoothThicknessValues(thicknessGrid, smoothing);

  // Step 3: Create vertex grid using smoothed thickness values
  const vertices: Vector3[][] = [];
  for (let row = 0; row <= segmentsH; row++) {
    vertices[row] = [];
    const v = row / segmentsH;
    const y = cylinderHeight * v - cylinderHeight / 2;
    const radius = radiusBottom + (radiusTop - radiusBottom) * v;

    for (let col = 0; col <= segmentsW; col++) {
      const u = col / segmentsW;
      const angle = angleRad * u;

      // Use smoothed thickness value
      const thickness = smoothedGrid[row][col];

      // Calculate position
      const x = (radius + thickness) * Math.cos(angle);
      const z = (radius + thickness) * Math.sin(angle);

      vertices[row][col] = { x, y, z };
    }
  }

  // Create triangles from grid
  for (let row = 0; row < segmentsH; row++) {
    for (let col = 0; col < segmentsW; col++) {
      const v1 = vertices[row][col];
      const v2 = vertices[row][col + 1];
      const v3 = vertices[row + 1][col + 1];
      const v4 = vertices[row + 1][col];

      // Triangle 1
      triangles.push({
        vertices: [v1, v2, v3],
        normal: calculateNormal(v1, v2, v3),
      });

      // Triangle 2
      triangles.push({
        vertices: [v1, v3, v4],
        normal: calculateNormal(v1, v3, v4),
      });
    }
  }

  // Add caps if angle is less than 360
  if (params.angle < 360) {
    // Start cap
    for (let row = 0; row < segmentsH; row++) {
      const v1 = { x: 0, y: vertices[row][0].y, z: 0 };
      const v2 = vertices[row][0];
      const v3 = vertices[row + 1][0];
      const v4 = { x: 0, y: vertices[row + 1][0].y, z: 0 };

      triangles.push({
        vertices: [v1, v3, v2],
        normal: calculateNormal(v1, v3, v2),
      });
      triangles.push({
        vertices: [v1, v4, v3],
        normal: calculateNormal(v1, v4, v3),
      });
    }

    // End cap
    for (let row = 0; row < segmentsH; row++) {
      const v1 = { x: 0, y: vertices[row][segmentsW].y, z: 0 };
      const v2 = vertices[row][segmentsW];
      const v3 = vertices[row + 1][segmentsW];
      const v4 = { x: 0, y: vertices[row + 1][segmentsW].y, z: 0 };

      triangles.push({
        vertices: [v1, v2, v3],
        normal: calculateNormal(v1, v2, v3),
      });
      triangles.push({
        vertices: [v1, v3, v4],
        normal: calculateNormal(v1, v3, v4),
      });
    }
  }

  // Add top and bottom caps
  // Bottom cap
  const centerBottom = { x: 0, y: -cylinderHeight / 2, z: 0 };
  for (let col = 0; col < segmentsW; col++) {
    const v1 = centerBottom;
    const v2 = vertices[0][col];
    const v3 = vertices[0][col + 1];

    triangles.push({
      vertices: [v1, v3, v2],
      normal: { x: 0, y: -1, z: 0 },
    });
  }

  // Top cap
  const centerTop = { x: 0, y: cylinderHeight / 2, z: 0 };
  for (let col = 0; col < segmentsW; col++) {
    const v1 = centerTop;
    const v2 = vertices[segmentsH][col];
    const v3 = vertices[segmentsH][col + 1];

    triangles.push({
      vertices: [v1, v2, v3],
      normal: { x: 0, y: 1, z: 0 },
    });
  }

  // Generate Binary STL
  return generateBinarySTL(triangles);
}

/**
 * Generate Binary STL format (much more compact than ASCII)
 * Binary STL is standard format supported by all slicers
 * Format: 80-byte header + 4-byte triangle count + 50 bytes per triangle
 */
function generateBinarySTL(triangles: Triangle[]): ArrayBuffer {
  const triangleCount = triangles.length;

  // Calculate buffer size
  // Header: 80 bytes
  // Triangle count: 4 bytes
  // Each triangle: 50 bytes (12 for normal + 36 for vertices + 2 for attribute)
  const bufferSize = 80 + 4 + (triangleCount * 50);
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  let offset = 0;

  // Write 80-byte header (ASCII "Lithophane Generator")
  const header = 'Lithophane Generator - Binary STL';
  for (let i = 0; i < 80; i++) {
    view.setUint8(offset++, i < header.length ? header.charCodeAt(i) : 0);
  }

  // Write triangle count (little-endian uint32)
  view.setUint32(offset, triangleCount, true);
  offset += 4;

  // Write each triangle
  for (const triangle of triangles) {
    const { normal, vertices } = triangle;

    // Normal vector (3 × float32)
    view.setFloat32(offset, normal.x, true); offset += 4;
    view.setFloat32(offset, normal.y, true); offset += 4;
    view.setFloat32(offset, normal.z, true); offset += 4;

    // Three vertices (9 × float32)
    for (const vertex of vertices) {
      view.setFloat32(offset, vertex.x, true); offset += 4;
      view.setFloat32(offset, vertex.y, true); offset += 4;
      view.setFloat32(offset, vertex.z, true); offset += 4;
    }

    // Attribute byte count (uint16) - typically 0
    view.setUint16(offset, 0, true);
    offset += 2;
  }

  return buffer;
}

export function downloadSTL(stl: ArrayBuffer, filename: string = 'lithophane.stl') {
  const blob = new Blob([stl], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
