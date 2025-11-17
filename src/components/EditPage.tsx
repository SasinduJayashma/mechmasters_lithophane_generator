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
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <div className="bg-gray-800 shadow-md px-6 py-4 flex items-center justify-between border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white">Edit Image</h1>
        <div className="flex gap-3">
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            ← Back to Upload
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Next: Generate Model →
          </button>
        </div>
      </div>

      {/* Main Content: Sidebar + Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Scrollable Settings (1/3 width) */}
        <div className="w-1/3 bg-gray-900 border-r border-gray-700 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Greyscaling */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-700">
                Greyscaling
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Method
                  </label>
                  <select
                    value={greyscaleSettings.method}
                    onChange={(e) =>
                      updateGreyscaleSettings({
                        method: e.target.value as 'averaging' | 'luminance' | 'blackwhite',
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="averaging">Averaging</option>
                    <option value="luminance">Luminance</option>
                    <option value="blackwhite">Black & White</option>
                  </select>
                </div>

                {/* Averaging Method */}
                {greyscaleSettings.method === 'averaging' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Background Intensity: <span className="text-blue-400 font-semibold">{greyscaleSettings.bgIntensity.toFixed(2)}</span>
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
                    <p className="text-xs text-gray-400 mt-1">
                      Controls the grey-scale of the background
                    </p>
                  </div>
                )}

                {/* Luminance Method */}
                {greyscaleSettings.method === 'luminance' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Red: <span className="text-blue-400 font-semibold">{greyscaleSettings.redSlider.toFixed(3)}</span>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Green: <span className="text-blue-400 font-semibold">{greyscaleSettings.greenSlider.toFixed(3)}</span>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Blue: <span className="text-blue-400 font-semibold">{greyscaleSettings.blueSlider.toFixed(3)}</span>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Background Intensity: <span className="text-blue-400 font-semibold">{greyscaleSettings.bgIntensity.toFixed(2)}</span>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Threshold: <span className="text-blue-400 font-semibold">{greyscaleSettings.threshold.toFixed(2)}</span>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Black Factor: <span className="text-blue-400 font-semibold">{greyscaleSettings.blackFactor.toFixed(2)}</span>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        White Factor: <span className="text-blue-400 font-semibold">{greyscaleSettings.whiteFactor.toFixed(2)}</span>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Background Intensity: <span className="text-blue-400 font-semibold">{greyscaleSettings.bgIntensity.toFixed(2)}</span>
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
            </div>

            {/* Image Adjustments */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-700">
                Image Adjustments
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Brightness: <span className="text-blue-400 font-semibold">{imageSettings.brightness}</span>
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
                  <p className="text-xs text-gray-400 mt-1">
                    Controls the brightness of the image
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contrast: <span className="text-blue-400 font-semibold">{imageSettings.contrast}</span>
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
                  <p className="text-xs text-gray-400 mt-1">
                    Increasing the contrast may enhance your image
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Exposure: <span className="text-blue-400 font-semibold">{imageSettings.exposure}</span>
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
                  <p className="text-xs text-gray-400 mt-1">
                    Controls the exposure of the image
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Blur: <span className="text-blue-400 font-semibold">{imageSettings.blur}</span>
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
                  <p className="text-xs text-gray-400 mt-1">
                    Blur radius in pixels
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview - Fixed Image Preview (2/3 width) */}
        <div className="flex-1 bg-gray-900 relative flex items-center justify-center p-8">
          {isProcessing && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <div className="text-white text-xl">Processing...</div>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain shadow-2xl"
            style={{ imageRendering: 'auto' }}
          />

          {/* Info Overlay */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white text-sm px-4 py-2 rounded-lg">
            <p>📸 Greyscale Preview</p>
          </div>
        </div>
      </div>
    </div>
  );
}
