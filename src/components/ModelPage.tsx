import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useStore } from '../store';
import { CylinderLithophane } from './CylinderLithophane';
import { generateCylinderLithophane, downloadSTL } from '../utils/stlGenerator';
import { useState, useMemo } from 'react';
import { estimateFileSize, getPreviewQualityLabel } from '../utils/qualityCalculations';

export function ModelPage() {
  const {
    processedImageData,
    cylinderParams,
    updateCylinderParams,
    modelOptions,
    updateModelOptions,
    qualitySettings,
    updateQualitySettings,
    setCurrentPage,
  } = useStore();

  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate estimated file size
  const estimatedFileSizeMB = useMemo(() => {
    return estimateFileSize(cylinderParams, qualitySettings.mmPerPixel);
  }, [cylinderParams, qualitySettings.mmPerPixel]);

  if (!processedImageData) {
    setCurrentPage('upload');
    return null;
  }

  const handleGenerateSTL = async () => {
    if (!processedImageData) return;

    setIsGenerating(true);
    try {
      const stl = generateCylinderLithophane(
        processedImageData,
        cylinderParams,
        modelOptions,
        qualitySettings.mmPerPixel,
        qualitySettings.smoothing
      );
      downloadSTL(stl, 'lithophane.stl');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    setCurrentPage('edit');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">3D Model Preview</h1>
        <div className="flex gap-3">
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            ← Back to Edit
          </button>
          <button
            onClick={handleGenerateSTL}
            disabled={isGenerating}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? '⏳ Generating...' : '⬇ Download STL'}
          </button>
        </div>
      </div>

      {/* Main Content: Sidebar + Viewer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Scrollable Settings (1/3 width) */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Quality Options */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                Quality Options
              </h2>

              <div className="space-y-4">
                {/* File Size Estimate */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Estimated File Size</p>
                  <p className={`text-3xl font-bold ${estimatedFileSizeMB > 480 ? 'text-red-600' : 'text-green-600'}`}>
                    {estimatedFileSizeMB.toFixed(0)} MB
                  </p>
                  {estimatedFileSizeMB > 480 && (
                    <p className="text-xs text-red-600 mt-2">
                      ⚠️ File exceeds 480 MB. Cura may not slice it.
                    </p>
                  )}
                </div>

                {/* mm per pixel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    mm per pixel: <span className="text-blue-600 font-semibold">{qualitySettings.mmPerPixel.toFixed(2)} mm</span>
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={qualitySettings.mmPerPixel}
                    onChange={(e) =>
                      updateQualitySettings({ mmPerPixel: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lower = higher quality but larger file size
                  </p>
                </div>

                {/* Preview Quality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview Quality
                  </label>
                  <select
                    value={qualitySettings.previewQuality}
                    onChange={(e) =>
                      updateQualitySettings({ previewQuality: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="lousy">{getPreviewQualityLabel('lousy')}</option>
                    <option value="low">{getPreviewQualityLabel('low')}</option>
                    <option value="medium">{getPreviewQualityLabel('medium')}</option>
                    <option value="high">{getPreviewQualityLabel('high')}</option>
                    <option value="native">{getPreviewQualityLabel('native')}</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Affects 3D viewer performance only
                  </p>
                </div>

                {/* Smoothing */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Surface Smoothing: <span className="text-blue-600 font-semibold">{qualitySettings.smoothing}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="1"
                    value={qualitySettings.smoothing}
                    onChange={(e) =>
                      updateQualitySettings({ smoothing: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Reduces spikes for easier printing (0 = none, 5 = max)
                  </p>
                </div>

                {/* Cura Fix */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Cura Fix
                    </label>
                    <p className="text-xs text-gray-500">
                      Prevents choppy curves in Cura 4.3+
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={qualitySettings.curaFix}
                    onChange={(e) =>
                      updateQualitySettings({ curaFix: e.target.checked })
                    }
                    className="w-5 h-5"
                  />
                </div>

                {/* Auto Update */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Auto Update
                    </label>
                    <p className="text-xs text-gray-500">
                      Update preview on changes
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={qualitySettings.autoUpdate}
                    onChange={(e) =>
                      updateQualitySettings({ autoUpdate: e.target.checked })
                    }
                    className="w-5 h-5"
                  />
                </div>
              </div>
            </div>

            {/* Cylinder Parameters */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                Cylinder Parameters
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diameter: <span className="text-blue-600 font-semibold">{cylinderParams.diameter.toFixed(1)} mm</span>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    step="0.1"
                    value={cylinderParams.diameter}
                    onChange={(e) => {
                      const diameter = parseFloat(e.target.value);
                      updateCylinderParams({
                        diameter,
                        diameterTop: diameter,
                        diameterBottom: diameter,
                      });
                    }}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diameter Top: <span className="text-blue-600 font-semibold">{cylinderParams.diameterTop.toFixed(1)} mm</span>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    step="0.1"
                    value={cylinderParams.diameterTop}
                    onChange={(e) =>
                      updateCylinderParams({ diameterTop: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diameter Bottom: <span className="text-blue-600 font-semibold">{cylinderParams.diameterBottom.toFixed(1)} mm</span>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    step="0.1"
                    value={cylinderParams.diameterBottom}
                    onChange={(e) =>
                      updateCylinderParams({ diameterBottom: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height: <span className="text-blue-600 font-semibold">{cylinderParams.height.toFixed(1)} mm</span>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="300"
                    step="0.1"
                    value={cylinderParams.height}
                    onChange={(e) =>
                      updateCylinderParams({ height: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Angle: <span className="text-blue-600 font-semibold">{cylinderParams.angle.toFixed(0)}°</span>
                  </label>
                  <input
                    type="range"
                    min="45"
                    max="360"
                    step="1"
                    value={cylinderParams.angle}
                    onChange={(e) =>
                      updateCylinderParams({ angle: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Thickness: <span className="text-blue-600 font-semibold">{cylinderParams.minThick.toFixed(1)} mm</span>
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="3"
                    step="0.1"
                    value={cylinderParams.minThick}
                    onChange={(e) =>
                      updateCylinderParams({ minThick: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Thickness: <span className="text-blue-600 font-semibold">{cylinderParams.maxThick.toFixed(1)} mm</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={cylinderParams.maxThick}
                    onChange={(e) =>
                      updateCylinderParams({ maxThick: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-gray-700">
                <p className="font-semibold mb-1">Recommended PLA thicknesses:</p>
                <p>• Esun cool white: [0.8, 3.0]</p>
                <p>• Solutech Silver: [0.6, 2.4]</p>
                <p>• Colorfabb White: [0.8, 3.3]</p>
              </div>
            </div>

            {/* Model Options */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                Model Options
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-700">
                    Back Lighted
                  </label>
                  <input
                    type="checkbox"
                    checked={modelOptions.backLighted}
                    onChange={(e) =>
                      updateModelOptions({ backLighted: e.target.checked })
                    }
                    className="w-5 h-5"
                  />
                </div>

                {modelOptions.backLighted && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Light Color
                      </label>
                      <input
                        type="color"
                        value={modelOptions.lightColor}
                        onChange={(e) =>
                          updateModelOptions({ lightColor: e.target.value })
                        }
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Light Intensity: <span className="text-blue-600 font-semibold">{modelOptions.lightIntensity}%</span>
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={modelOptions.lightIntensity}
                        onChange={(e) =>
                          updateModelOptions({ lightIntensity: parseFloat(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material Color
                  </label>
                  <input
                    type="color"
                    value={modelOptions.materialColor}
                    onChange={(e) =>
                      updateModelOptions({ materialColor: e.target.value })
                    }
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-700">
                    Positive Image
                  </label>
                  <input
                    type="checkbox"
                    checked={modelOptions.positiveImage}
                    onChange={(e) =>
                      updateModelOptions({ positiveImage: e.target.checked })
                    }
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-700">
                    Flip Image
                  </label>
                  <input
                    type="checkbox"
                    checked={modelOptions.flipImage}
                    onChange={(e) =>
                      updateModelOptions({ flipImage: e.target.checked })
                    }
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-700">
                    Mirror Image
                  </label>
                  <input
                    type="checkbox"
                    checked={modelOptions.mirrorImage}
                    onChange={(e) =>
                      updateModelOptions({ mirrorImage: e.target.checked })
                    }
                    className="w-5 h-5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placement Horizontal: <span className="text-blue-600 font-semibold">{modelOptions.placementHorizontal}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={modelOptions.placementHorizontal}
                    onChange={(e) =>
                      updateModelOptions({ placementHorizontal: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placement Vertical: <span className="text-blue-600 font-semibold">{modelOptions.placementVertical}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={modelOptions.placementVertical}
                    onChange={(e) =>
                      updateModelOptions({ placementVertical: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zoom Factor: <span className="text-blue-600 font-semibold">{modelOptions.zoomFactor}%</span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="5"
                    value={modelOptions.zoomFactor}
                    onChange={(e) =>
                      updateModelOptions({ zoomFactor: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Viewer - Fixed 3D Preview (2/3 width) */}
        <div className="flex-1 bg-gray-900 relative">
          <Canvas>
            <PerspectiveCamera makeDefault position={[0, 0, 200]} />
            <OrbitControls enableDamping />

            {/* Lighting */}
            <ambientLight intensity={0.3} />
            {modelOptions.backLighted && (
              <pointLight
                position={[0, 0, 0]}
                intensity={modelOptions.lightIntensity / 100}
                color={modelOptions.lightColor}
              />
            )}
            <directionalLight position={[10, 10, 5]} intensity={0.5} />
            <directionalLight position={[-10, -10, -5]} intensity={0.3} />

            {/* Lithophane */}
            <CylinderLithophane
              imageData={processedImageData}
              params={cylinderParams}
              options={modelOptions}
              mmPerPixel={qualitySettings.mmPerPixel}
              previewQuality={qualitySettings.previewQuality}
              smoothing={qualitySettings.smoothing}
            />
          </Canvas>

          {/* Help Text Overlay */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white text-sm px-4 py-2 rounded-lg">
            <p>🖱️ Left Click + Drag to Rotate</p>
            <p>🖱️ Right Click + Drag to Pan</p>
            <p>🖱️ Scroll to Zoom</p>
          </div>
        </div>
      </div>
    </div>
  );
}
