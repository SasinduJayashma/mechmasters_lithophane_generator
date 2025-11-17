import { CylinderParams, PreviewQuality } from '../store';

/**
 * Calculate the number of segments for width and height based on quality settings
 */
export function calculateSegments(
  cylinderParams: CylinderParams,
  mmPerPixel: number,
  previewQuality: PreviewQuality
): { segmentsW: number; segmentsH: number } {
  // Calculate segments for final quality based on mm per pixel
  const circumference = Math.PI * cylinderParams.diameter * (cylinderParams.angle / 360);
  const finalSegmentsW = Math.floor(circumference / mmPerPixel);
  const finalSegmentsH = Math.floor(cylinderParams.height / mmPerPixel);

  // For preview quality, use fixed resolutions unless native
  if (previewQuality === 'native') {
    return {
      segmentsW: finalSegmentsW,
      segmentsH: finalSegmentsH,
    };
  }

  const qualityMap: Record<Exclude<PreviewQuality, 'native'>, number> = {
    lousy: 200,
    low: 500,
    medium: 1000,
    high: 2000,
  };

  const maxSegments = qualityMap[previewQuality];

  // Use the smaller of the fixed quality or final quality
  return {
    segmentsW: Math.min(finalSegmentsW, maxSegments),
    segmentsH: Math.min(finalSegmentsH, maxSegments),
  };
}

/**
 * Estimate the STL file size in MB based on the number of triangles
 */
export function estimateFileSize(
  cylinderParams: CylinderParams,
  mmPerPixel: number
): number {
  const circumference = Math.PI * cylinderParams.diameter * (cylinderParams.angle / 360);
  const segmentsW = Math.floor(circumference / mmPerPixel);
  const segmentsH = Math.floor(cylinderParams.height / mmPerPixel);

  // Each quad creates 2 triangles
  const mainSurfaceTriangles = segmentsW * segmentsH * 2;

  // Add caps
  let capTriangles = 0;

  // Top and bottom caps
  capTriangles += segmentsW * 2; // Top cap
  capTriangles += segmentsW * 2; // Bottom cap

  // Side caps if angle < 360
  if (cylinderParams.angle < 360) {
    capTriangles += segmentsH * 4; // Two side caps
  }

  const totalTriangles = mainSurfaceTriangles + capTriangles;

  // ASCII STL format: approximately 84 bytes per triangle
  // Binary STL format: 50 bytes per triangle + 84 byte header
  // We'll use ASCII format estimation as it's more common for lithophanes
  const bytesPerTriangle = 84;
  const headerBytes = 200; // Approximate header size

  const totalBytes = totalTriangles * bytesPerTriangle + headerBytes;
  const megabytes = totalBytes / (1024 * 1024);

  return megabytes;
}

/**
 * Get preview quality label
 */
export function getPreviewQualityLabel(quality: PreviewQuality): string {
  const labels: Record<PreviewQuality, string> = {
    lousy: 'Lousy (200×200)',
    low: 'Low (500×500)',
    medium: 'Medium (1000×1000)',
    high: 'High (2000×2000)',
    native: 'Native (Final Quality)',
  };
  return labels[quality];
}
