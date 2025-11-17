import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { CylinderParams, ModelOptions, PreviewQuality } from '../store';
import { calculateSegments } from '../utils/qualityCalculations';
import { smoothThicknessValues } from '../utils/smoothing';

interface Props {
  imageData: ImageData;
  params: CylinderParams;
  options: ModelOptions;
  mmPerPixel: number;
  previewQuality: PreviewQuality;
  smoothing: number;
}

export function CylinderLithophane({ imageData, params, options, mmPerPixel, previewQuality, smoothing }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerCylinderRef = useRef<THREE.Mesh>(null);

  // Removed auto-rotation - user can manually rotate with mouse

  const geometry = useMemo(() => {
    const { width, height, data } = imageData;

    // Calculate parameters
    const radiusBottom = params.diameterBottom / 2;
    const radiusTop = params.diameterTop / 2;
    const cylinderHeight = params.height;
    const angleRad = (params.angle * Math.PI) / 180;

    // Calculate segments based on quality settings
    const { segmentsW, segmentsH } = calculateSegments(
      params,
      mmPerPixel,
      previewQuality
    );

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

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

        // Get greyscale value
        let greyValue = data[idx] / 255;

        // Apply transformations
        if (!options.positiveImage) {
          greyValue = 1 - greyValue;
        }

        // Map greyscale to thickness
        const thickness = params.minThick + greyValue * (params.maxThick - params.minThick);
        thicknessGrid[row][col] = thickness;
      }
    }

    // Step 2: Apply smoothing to reduce spikes
    const smoothedGrid = smoothThicknessValues(thicknessGrid, smoothing);

    // Step 3: Create vertices using smoothed thickness values
    for (let row = 0; row <= segmentsH; row++) {
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

        vertices.push(x, y, z);
        uvs.push(u, 1 - v);
      }
    }

    // Create faces
    for (let row = 0; row < segmentsH; row++) {
      for (let col = 0; col < segmentsW; col++) {
        const a = row * (segmentsW + 1) + col;
        const b = row * (segmentsW + 1) + col + 1;
        const c = (row + 1) * (segmentsW + 1) + col + 1;
        const d = (row + 1) * (segmentsW + 1) + col;

        indices.push(a, b, c);
        indices.push(a, c, d);
      }
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();

    return geometry;
  }, [imageData, params, options, mmPerPixel, previewQuality, smoothing]);

  // Create texture from image data
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [imageData]);

  // Create inner cylinder geometry (flat wall)
  const innerGeometry = useMemo(() => {
    const radiusBottom = params.diameterBottom / 2;
    const radiusTop = params.diameterTop / 2;
    const cylinderHeight = params.height;
    const angleRad = (params.angle * Math.PI) / 180;

    const { segmentsW, segmentsH } = calculateSegments(
      params,
      mmPerPixel,
      previewQuality
    );

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    // Create vertices for inner cylinder (smooth, no texture variation)
    for (let row = 0; row <= segmentsH; row++) {
      const v = row / segmentsH;
      const y = cylinderHeight * v - cylinderHeight / 2;
      const radius = radiusBottom + (radiusTop - radiusBottom) * v;

      for (let col = 0; col <= segmentsW; col++) {
        const u = col / segmentsW;
        const angle = angleRad * u;

        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);

        vertices.push(x, y, z);
      }
    }

    // Create faces (same topology as outer surface)
    for (let row = 0; row < segmentsH; row++) {
      for (let col = 0; col < segmentsW; col++) {
        const a = row * (segmentsW + 1) + col;
        const b = row * (segmentsW + 1) + col + 1;
        const c = (row + 1) * (segmentsW + 1) + col + 1;
        const d = (row + 1) * (segmentsW + 1) + col;

        // Reverse winding order for inner surface
        indices.push(a, c, b);
        indices.push(a, d, c);
      }
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();

    return geometry;
  }, [params, mmPerPixel, previewQuality]);

  // Create side caps geometry (connecting inner and outer walls at the edges when angle < 360)
  const sideCapsGeometry = useMemo(() => {
    if (params.angle >= 360) return null;

    const radiusBottom = params.diameterBottom / 2;
    const radiusTop = params.diameterTop / 2;
    const cylinderHeight = params.height;
    const angleRad = (params.angle * Math.PI) / 180;

    const { segmentsW, segmentsH } = calculateSegments(
      params,
      mmPerPixel,
      previewQuality
    );

    // Build thickness grid (same as outer surface)
    const thicknessGrid: number[][] = [];
    for (let row = 0; row <= segmentsH; row++) {
      thicknessGrid[row] = [];
      const v = row / segmentsH;

      for (let col = 0; col <= segmentsW; col++) {
        const u = col / segmentsW;
        const imgX = Math.floor(u * (imageData.width - 1));
        const imgY = Math.floor(v * (imageData.height - 1));
        const idx = (imgY * imageData.width + imgX) * 4;
        let greyValue = imageData.data[idx] / 255;
        if (!options.positiveImage) {
          greyValue = 1 - greyValue;
        }
        const thickness = params.minThick + greyValue * (params.maxThick - params.minThick);
        thicknessGrid[row][col] = thickness;
      }
    }

    const smoothedGrid = smoothThicknessValues(thicknessGrid, smoothing);

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    // Start cap (at angle 0)
    for (let row = 0; row <= segmentsH; row++) {
      const v = row / segmentsH;
      const y = cylinderHeight * v - cylinderHeight / 2;
      const radius = radiusBottom + (radiusTop - radiusBottom) * v;

      // Inner vertex
      const innerX = radius * Math.cos(0);
      const innerZ = radius * Math.sin(0);
      vertices.push(innerX, y, innerZ);

      // Outer vertex
      const thickness = smoothedGrid[row][0];
      const outerX = (radius + thickness) * Math.cos(0);
      const outerZ = (radius + thickness) * Math.sin(0);
      vertices.push(outerX, y, outerZ);
    }

    // Create faces for start cap
    for (let row = 0; row < segmentsH; row++) {
      const innerBottom = row * 2;
      const outerBottom = row * 2 + 1;
      const innerTop = (row + 1) * 2;
      const outerTop = (row + 1) * 2 + 1;

      indices.push(innerBottom, innerTop, outerTop);
      indices.push(innerBottom, outerTop, outerBottom);
    }

    // End cap (at angle = params.angle)
    const startCapVertexCount = (segmentsH + 1) * 2;
    for (let row = 0; row <= segmentsH; row++) {
      const v = row / segmentsH;
      const y = cylinderHeight * v - cylinderHeight / 2;
      const radius = radiusBottom + (radiusTop - radiusBottom) * v;

      // Inner vertex
      const innerX = radius * Math.cos(angleRad);
      const innerZ = radius * Math.sin(angleRad);
      vertices.push(innerX, y, innerZ);

      // Outer vertex
      const thickness = smoothedGrid[row][segmentsW];
      const outerX = (radius + thickness) * Math.cos(angleRad);
      const outerZ = (radius + thickness) * Math.sin(angleRad);
      vertices.push(outerX, y, outerZ);
    }

    // Create faces for end cap (reversed winding)
    for (let row = 0; row < segmentsH; row++) {
      const innerBottom = startCapVertexCount + row * 2;
      const outerBottom = startCapVertexCount + row * 2 + 1;
      const innerTop = startCapVertexCount + (row + 1) * 2;
      const outerTop = startCapVertexCount + (row + 1) * 2 + 1;

      indices.push(innerBottom, outerBottom, outerTop);
      indices.push(innerBottom, outerTop, innerTop);
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();

    return geometry;
  }, [params, imageData, options, mmPerPixel, previewQuality, smoothing]);

  // Create bottom cover geometry (connecting inner and outer walls at the bottom)
  const bottomCoverGeometry = useMemo(() => {
    if (!params.hasBottomCover) return null;

    const radiusBottom = params.diameterBottom / 2;
    const cylinderHeight = params.height;
    const angleRad = (params.angle * Math.PI) / 180;

    const { segmentsW } = calculateSegments(
      params,
      mmPerPixel,
      previewQuality
    );

    // Build thickness grid for bottom row
    const thicknessRow: number[] = [];
    for (let col = 0; col <= segmentsW; col++) {
      const u = col / segmentsW;
      const imgX = Math.floor(u * (imageData.width - 1));
      const imgY = 0; // bottom row
      const idx = (imgY * imageData.width + imgX) * 4;
      let greyValue = imageData.data[idx] / 255;
      if (!options.positiveImage) {
        greyValue = 1 - greyValue;
      }
      const thickness = params.minThick + greyValue * (params.maxThick - params.minThick);
      thicknessRow[col] = thickness;
    }

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    const y = -cylinderHeight / 2;

    // Create vertices for bottom ring
    for (let col = 0; col <= segmentsW; col++) {
      const u = col / segmentsW;
      const angle = angleRad * u;

      // Inner vertex
      const innerX = radiusBottom * Math.cos(angle);
      const innerZ = radiusBottom * Math.sin(angle);
      vertices.push(innerX, y, innerZ);

      // Outer vertex
      const thickness = thicknessRow[col];
      const outerX = (radiusBottom + thickness) * Math.cos(angle);
      const outerZ = (radiusBottom + thickness) * Math.sin(angle);
      vertices.push(outerX, y, outerZ);
    }

    // Create faces for bottom ring
    for (let col = 0; col < segmentsW; col++) {
      const innerLeft = col * 2;
      const outerLeft = col * 2 + 1;
      const innerRight = (col + 1) * 2;
      const outerRight = (col + 1) * 2 + 1;

      indices.push(innerLeft, outerLeft, outerRight);
      indices.push(innerLeft, outerRight, innerRight);
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();

    return geometry;
  }, [params, imageData, options, mmPerPixel, previewQuality]);

  // Create top cover geometry (connecting inner and outer walls at the top)
  const topCoverGeometry = useMemo(() => {
    if (!params.hasTopCover) return null;

    const radiusTop = params.diameterTop / 2;
    const cylinderHeight = params.height;
    const angleRad = (params.angle * Math.PI) / 180;

    const { segmentsW } = calculateSegments(
      params,
      mmPerPixel,
      previewQuality
    );

    // Build thickness grid for top row
    const thicknessRow: number[] = [];
    for (let col = 0; col <= segmentsW; col++) {
      const u = col / segmentsW;
      const imgX = Math.floor(u * (imageData.width - 1));
      const imgY = imageData.height - 1; // top row
      const idx = (imgY * imageData.width + imgX) * 4;
      let greyValue = imageData.data[idx] / 255;
      if (!options.positiveImage) {
        greyValue = 1 - greyValue;
      }
      const thickness = params.minThick + greyValue * (params.maxThick - params.minThick);
      thicknessRow[col] = thickness;
    }

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    const y = cylinderHeight / 2;

    // Create vertices for top ring
    for (let col = 0; col <= segmentsW; col++) {
      const u = col / segmentsW;
      const angle = angleRad * u;

      // Inner vertex
      const innerX = radiusTop * Math.cos(angle);
      const innerZ = radiusTop * Math.sin(angle);
      vertices.push(innerX, y, innerZ);

      // Outer vertex
      const thickness = thicknessRow[col];
      const outerX = (radiusTop + thickness) * Math.cos(angle);
      const outerZ = (radiusTop + thickness) * Math.sin(angle);
      vertices.push(outerX, y, outerZ);
    }

    // Create faces for top ring (reversed winding for upward-facing normals)
    for (let col = 0; col < segmentsW; col++) {
      const innerLeft = col * 2;
      const outerLeft = col * 2 + 1;
      const innerRight = (col + 1) * 2;
      const outerRight = (col + 1) * 2 + 1;

      indices.push(innerLeft, innerRight, outerRight);
      indices.push(innerLeft, outerRight, outerLeft);
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();

    return geometry;
  }, [params, imageData, options, mmPerPixel, previewQuality]);

  return (
    <>
      {/* Outer textured surface */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          map={texture}
          color={options.materialColor}
          side={THREE.FrontSide}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Inner flat wall */}
      <mesh ref={innerCylinderRef} geometry={innerGeometry}>
        <meshStandardMaterial
          color={options.materialColor}
          side={THREE.FrontSide}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Side caps (when angle < 360) */}
      {sideCapsGeometry && (
        <mesh geometry={sideCapsGeometry}>
          <meshStandardMaterial
            color={options.materialColor}
            side={THREE.DoubleSide}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      )}

      {/* Bottom cover */}
      {bottomCoverGeometry && (
        <mesh geometry={bottomCoverGeometry}>
          <meshStandardMaterial
            color={options.materialColor}
            side={THREE.DoubleSide}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      )}

      {/* Top cover */}
      {topCoverGeometry && (
        <mesh geometry={topCoverGeometry}>
          <meshStandardMaterial
            color={options.materialColor}
            side={THREE.DoubleSide}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      )}
    </>
  );
}
