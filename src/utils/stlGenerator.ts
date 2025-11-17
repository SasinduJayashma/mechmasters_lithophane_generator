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

  // Step 3: Create TWO vertex grids - one for inner wall (flat) and one for outer wall (patterned)
  const innerVertices: Vector3[][] = [];
  const outerVertices: Vector3[][] = [];

  for (let row = 0; row <= segmentsH; row++) {
    innerVertices[row] = [];
    outerVertices[row] = [];
    const v = row / segmentsH;
    const y = cylinderHeight * v - cylinderHeight / 2;
    const radius = radiusBottom + (radiusTop - radiusBottom) * v;

    for (let col = 0; col <= segmentsW; col++) {
      const u = col / segmentsW;
      const angle = angleRad * u;

      // Inner wall: flat surface at constant radius (no thickness variation)
      const innerX = radius * Math.cos(angle);
      const innerZ = radius * Math.sin(angle);
      innerVertices[row][col] = { x: innerX, y, z: innerZ };

      // Outer wall: radius + thickness (lithophane pattern)
      const thickness = smoothedGrid[row][col];
      const outerX = (radius + thickness) * Math.cos(angle);
      const outerZ = (radius + thickness) * Math.sin(angle);
      outerVertices[row][col] = { x: outerX, y, z: outerZ };
    }
  }

  // Create outer wall triangles (with lithophane pattern)
  for (let row = 0; row < segmentsH; row++) {
    for (let col = 0; col < segmentsW; col++) {
      const v1 = outerVertices[row][col];
      const v2 = outerVertices[row][col + 1];
      const v3 = outerVertices[row + 1][col + 1];
      const v4 = outerVertices[row + 1][col];

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

  // Create inner wall triangles (flat surface - note reversed winding for inward-facing normals)
  for (let row = 0; row < segmentsH; row++) {
    for (let col = 0; col < segmentsW; col++) {
      const v1 = innerVertices[row][col];
      const v2 = innerVertices[row][col + 1];
      const v3 = innerVertices[row + 1][col + 1];
      const v4 = innerVertices[row + 1][col];

      // Triangle 1 (reversed winding)
      triangles.push({
        vertices: [v1, v3, v2],
        normal: calculateNormal(v1, v3, v2),
      });

      // Triangle 2 (reversed winding)
      triangles.push({
        vertices: [v1, v4, v3],
        normal: calculateNormal(v1, v4, v3),
      });
    }
  }

  // Add side caps if angle is less than 360 (connect inner and outer walls at edges)
  if (params.angle < 360) {
    // Start cap (at angle 0)
    for (let row = 0; row < segmentsH; row++) {
      const innerBottom = innerVertices[row][0];
      const innerTop = innerVertices[row + 1][0];
      const outerBottom = outerVertices[row][0];
      const outerTop = outerVertices[row + 1][0];

      // Two triangles forming the rectangular cap
      triangles.push({
        vertices: [innerBottom, innerTop, outerTop],
        normal: calculateNormal(innerBottom, innerTop, outerTop),
      });
      triangles.push({
        vertices: [innerBottom, outerTop, outerBottom],
        normal: calculateNormal(innerBottom, outerTop, outerBottom),
      });
    }

    // End cap (at angle = params.angle)
    for (let row = 0; row < segmentsH; row++) {
      const innerBottom = innerVertices[row][segmentsW];
      const innerTop = innerVertices[row + 1][segmentsW];
      const outerBottom = outerVertices[row][segmentsW];
      const outerTop = outerVertices[row + 1][segmentsW];

      // Two triangles forming the rectangular cap (reversed winding)
      triangles.push({
        vertices: [innerBottom, outerBottom, outerTop],
        normal: calculateNormal(innerBottom, outerBottom, outerTop),
      });
      triangles.push({
        vertices: [innerBottom, outerTop, innerTop],
        normal: calculateNormal(innerBottom, outerTop, innerTop),
      });
    }
  }

  // Add top and bottom rings (connect inner and outer walls at top and bottom edges)
  // Bottom ring
  if (params.hasBottomCover) {
    for (let col = 0; col < segmentsW; col++) {
      const innerLeft = innerVertices[0][col];
      const innerRight = innerVertices[0][col + 1];
      const outerLeft = outerVertices[0][col];
      const outerRight = outerVertices[0][col + 1];

      // Two triangles forming the ring segment
      triangles.push({
        vertices: [innerLeft, outerLeft, outerRight],
        normal: calculateNormal(innerLeft, outerLeft, outerRight),
      });
      triangles.push({
        vertices: [innerLeft, outerRight, innerRight],
        normal: calculateNormal(innerLeft, outerRight, innerRight),
      });
    }
  }

  // Top ring
  if (params.hasTopCover) {
    for (let col = 0; col < segmentsW; col++) {
      const innerLeft = innerVertices[segmentsH][col];
      const innerRight = innerVertices[segmentsH][col + 1];
      const outerLeft = outerVertices[segmentsH][col];
      const outerRight = outerVertices[segmentsH][col + 1];

      // Two triangles forming the ring segment (reversed winding for upward-facing normals)
      triangles.push({
        vertices: [innerLeft, innerRight, outerRight],
        normal: calculateNormal(innerLeft, innerRight, outerRight),
      });
      triangles.push({
        vertices: [innerLeft, outerRight, outerLeft],
        normal: calculateNormal(innerLeft, outerRight, outerLeft),
      });
    }
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
