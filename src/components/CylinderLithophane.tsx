import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
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

  // Rotate the mesh slowly
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

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

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        map={texture}
        color={options.materialColor}
        side={THREE.DoubleSide}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}
