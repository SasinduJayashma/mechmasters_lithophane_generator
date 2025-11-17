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
        qualitySettings.mmPerPixel
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">3D Model Preview</h1>
            <div className="flex gap-2">
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleGenerateSTL}
                disabled={isGenerating}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400"
              >
                {isGenerating ? 'Generating...' : 'Download STL'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 3D Preview */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">3D Preview</h2>
            <div className="bg-gray-900 rounded-lg overflow-hidden" style={{ height: '600px' }}>
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
                />
              </Canvas>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Use mouse to rotate, zoom, and pan the model
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Quality Options */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Quality Options</h2>

              <div className="space-y-4">
                {/* File Size Estimate */}
                <div className="p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Estimated file size:</p>
                  <p className={`text-2xl font-bold ${estimatedFileSizeMB > 480 ? 'text-red-600' : 'text-green-600'}`}>
                    {estimatedFileSizeMB.toFixed(0)} MB
                  </p>
                  {estimatedFileSizeMB > 480 && (
                    <p className="text-xs text-red-600 mt-1">
                      Warning: File size exceeds 480 MB. Cura may not be able to slice this file.
                    </p>
                  )}
                </div>

                {/* mm per pixel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    mm per pixel: {qualitySettings.mmPerPixel.toFixed(2)} mm
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
                    Lower values = higher quality but larger file size
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
                    Preview quality affects 3D viewer performance only
                  </p>
                </div>

                {/* Cura Fix */}
                <div className="flex items-center justify-between">
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
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Auto Update
                    </label>
                    <p className="text-xs text-gray-500">
                      Automatically update preview on changes
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
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Cylinder Parameters</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diameter: {cylinderParams.diameter.toFixed(1)} mm
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
                    Diameter Top: {cylinderParams.diameterTop.toFixed(1)} mm
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
                    Diameter Bottom: {cylinderParams.diameterBottom.toFixed(1)} mm
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
                    Height: {cylinderParams.height.toFixed(1)} mm
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
                    Angle: {cylinderParams.angle.toFixed(0)}°
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
                    Min Thickness: {cylinderParams.minThick.toFixed(1)} mm
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
                    Max Thickness: {cylinderParams.maxThick.toFixed(1)} mm
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
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Model Options</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
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
                        Light Intensity: {modelOptions.lightIntensity}%
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

                <div className="flex items-center justify-between">
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

                <div className="flex items-center justify-between">
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

                <div className="flex items-center justify-between">
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
                    Placement Horizontal: {modelOptions.placementHorizontal}%
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
                    Placement Vertical: {modelOptions.placementVertical}%
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
                    Zoom Factor: {modelOptions.zoomFactor}%
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
      </div>
    </div>
  );
}
