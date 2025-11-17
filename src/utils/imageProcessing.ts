import { GreyscaleSettings, ImageSettings } from '../store';

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function imageToImageData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function applyGreyscale(
  imageData: ImageData,
  settings: GreyscaleSettings
): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const result = new ImageData(data, imageData.width, imageData.height);

  for (let i = 0; i < result.data.length; i += 4) {
    const r = result.data[i];
    const g = result.data[i + 1];
    const b = result.data[i + 2];
    const a = result.data[i + 3];

    let grey: number;

    switch (settings.method) {
      case 'averaging':
        grey = 0.33 * r + 0.33 * g + 0.33 * b;
        // Apply background intensity for transparent pixels
        if (a < 255) {
          const alpha = a / 255;
          const bgValue = settings.bgIntensity * 255;
          grey = grey * alpha + bgValue * (1 - alpha);
        }
        break;

      case 'luminance':
        grey =
          settings.redSlider * r +
          settings.greenSlider * g +
          settings.blueSlider * b;
        // Apply background intensity for transparent pixels
        if (a < 255) {
          const alpha = a / 255;
          const bgValue = settings.bgIntensity * 255;
          grey = grey * alpha + bgValue * (1 - alpha);
        }
        break;

      case 'blackwhite':
        const avgValue = (r + g + b) / 3;
        const normalizedAvg = avgValue / 255;

        if (normalizedAvg > settings.threshold) {
          grey = Math.min(255, avgValue + (255 - avgValue) * settings.whiteFactor);
        } else {
          grey = Math.max(0, avgValue - avgValue * settings.blackFactor);
        }

        // Apply background intensity for transparent pixels
        if (a < 255) {
          const alpha = a / 255;
          const bgValue = settings.bgIntensity * 255;
          grey = grey * alpha + bgValue * (1 - alpha);
        }
        break;
    }

    result.data[i] = grey;
    result.data[i + 1] = grey;
    result.data[i + 2] = grey;
    result.data[i + 3] = 255; // Full opacity after processing
  }

  return result;
}

export function applyImageAdjustments(
  imageData: ImageData,
  settings: ImageSettings
): ImageData {
  let result = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );

  // Apply blur if needed
  if (settings.blur > 0) {
    result = applyBoxBlur(result, Math.round(settings.blur));
  }

  // Apply brightness, contrast, and exposure
  for (let i = 0; i < result.data.length; i += 4) {
    let r = result.data[i];
    let g = result.data[i + 1];
    let b = result.data[i + 2];

    // Apply exposure (multiplicative)
    const exposureFactor = Math.pow(2, settings.exposure / 100);
    r *= exposureFactor;
    g *= exposureFactor;
    b *= exposureFactor;

    // Apply brightness (additive)
    const brightnessFactor = (settings.brightness / 100) * 255;
    r += brightnessFactor;
    g += brightnessFactor;
    b += brightnessFactor;

    // Apply contrast
    const contrastFactor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // Clamp values
    result.data[i] = Math.max(0, Math.min(255, r));
    result.data[i + 1] = Math.max(0, Math.min(255, g));
    result.data[i + 2] = Math.max(0, Math.min(255, b));
  }

  return result;
}

function applyBoxBlur(imageData: ImageData, radius: number): ImageData {
  const { width, height, data } = imageData;
  const result = new ImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, count = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = Math.min(width - 1, Math.max(0, x + dx));
          const ny = Math.min(height - 1, Math.max(0, y + dy));
          const idx = (ny * width + nx) * 4;

          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count++;
        }
      }

      const idx = (y * width + x) * 4;
      result.data[idx] = r / count;
      result.data[idx + 1] = g / count;
      result.data[idx + 2] = b / count;
      result.data[idx + 3] = data[idx + 3];
    }
  }

  return result;
}

export function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function imageDataToDataURL(imageData: ImageData): string {
  return imageDataToCanvas(imageData).toDataURL();
}
