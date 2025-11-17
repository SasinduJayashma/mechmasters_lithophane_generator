import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import {
  applyGreyscale,
  applyImageAdjustments,
  loadImage,
  imageToImageData,
} from '../utils/imageProcessing';

export function EditPage() {
  const {
    originalImage,
    setProcessedImageData,
    greyscaleSettings,
    updateGreyscaleSettings,
    imageSettings,
    updateImageSettings,
    setCurrentPage,
  } = useStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!originalImage) {
      setCurrentPage('upload');
      return;
    }

    processImage();
  }, [
    originalImage,
    greyscaleSettings,
    imageSettings,
  ]);

  const processImage = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    try {
      const img = await loadImage(originalImage);
      let imageData = imageToImageData(img);

      // Apply greyscale
      imageData = applyGreyscale(imageData, greyscaleSettings);

      // Apply image adjustments
      imageData = applyImageAdjustments(imageData, imageSettings);

      setProcessedImageData(imageData);

      // Draw to canvas
      if (canvasRef.current) {
        canvasRef.current.width = imageData.width;
        canvasRef.current.height = imageData.height;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.putImageData(imageData, 0, 0);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    setCurrentPage('model');
  };

  const handleBack = () => {
    setCurrentPage('upload');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Edit Image</h1>
            <div className="flex gap-2">
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Next: Generate Model
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Preview */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              {isProcessing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <div className="text-white">Processing...</div>
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="w-full h-auto"
                style={{ maxHeight: '600px', objectFit: 'contain' }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Greyscaling */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Greyscaling</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Method
                </label>
                <select
                  value={greyscaleSettings.method}
                  onChange={(e) =>
                    updateGreyscaleSettings({
                      method: e.target.value as 'averaging' | 'luminance' | 'blackwhite',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="averaging">Averaging</option>
                  <option value="luminance">Luminance</option>
                  <option value="blackwhite">Black & White</option>
                </select>
              </div>

              {/* Averaging Method */}
              {greyscaleSettings.method === 'averaging' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Intensity: {greyscaleSettings.bgIntensity.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={greyscaleSettings.bgIntensity}
                    onChange={(e) =>
                      updateGreyscaleSettings({ bgIntensity: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Controls the grey-scale of the background
                  </p>
                </div>
              )}

              {/* Luminance Method */}
              {greyscaleSettings.method === 'luminance' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Red: {greyscaleSettings.redSlider.toFixed(3)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.001"
                      value={greyscaleSettings.redSlider}
                      onChange={(e) =>
                        updateGreyscaleSettings({ redSlider: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Green: {greyscaleSettings.greenSlider.toFixed(3)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.001"
                      value={greyscaleSettings.greenSlider}
                      onChange={(e) =>
                        updateGreyscaleSettings({ greenSlider: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blue: {greyscaleSettings.blueSlider.toFixed(3)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.001"
                      value={greyscaleSettings.blueSlider}
                      onChange={(e) =>
                        updateGreyscaleSettings({ blueSlider: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Intensity: {greyscaleSettings.bgIntensity.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={greyscaleSettings.bgIntensity}
                      onChange={(e) =>
                        updateGreyscaleSettings({ bgIntensity: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Black & White Method */}
              {greyscaleSettings.method === 'blackwhite' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Threshold: {greyscaleSettings.threshold.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={greyscaleSettings.threshold}
                      onChange={(e) =>
                        updateGreyscaleSettings({ threshold: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Black Factor: {greyscaleSettings.blackFactor.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={greyscaleSettings.blackFactor}
                      onChange={(e) =>
                        updateGreyscaleSettings({ blackFactor: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      White Factor: {greyscaleSettings.whiteFactor.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={greyscaleSettings.whiteFactor}
                      onChange={(e) =>
                        updateGreyscaleSettings({ whiteFactor: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Intensity: {greyscaleSettings.bgIntensity.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={greyscaleSettings.bgIntensity}
                      onChange={(e) =>
                        updateGreyscaleSettings({ bgIntensity: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Image Editor */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Image Adjustments</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brightness: {imageSettings.brightness}
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={imageSettings.brightness}
                    onChange={(e) =>
                      updateImageSettings({ brightness: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Controls the brightness of the image
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contrast: {imageSettings.contrast}
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={imageSettings.contrast}
                    onChange={(e) =>
                      updateImageSettings({ contrast: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Increasing the contrast may enhance your image
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exposure: {imageSettings.exposure}
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={imageSettings.exposure}
                    onChange={(e) =>
                      updateImageSettings({ exposure: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Controls the exposure of the image
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blur: {imageSettings.blur}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={imageSettings.blur}
                    onChange={(e) =>
                      updateImageSettings({ blur: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Blur radius in pixels
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
