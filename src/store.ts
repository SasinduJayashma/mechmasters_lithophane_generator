import { create } from 'zustand';

export type GreyscaleMethod = 'averaging' | 'luminance' | 'blackwhite';
export type PreviewQuality = 'lousy' | 'low' | 'medium' | 'high' | 'native';

export interface ImageSettings {
  brightness: number;
  contrast: number;
  exposure: number;
  blur: number;
}

export interface GreyscaleSettings {
  method: GreyscaleMethod;
  // Averaging
  bgIntensity: number;
  // Luminance
  redSlider: number;
  greenSlider: number;
  blueSlider: number;
  // Black & White
  threshold: number;
  blackFactor: number;
  whiteFactor: number;
}

export interface CylinderParams {
  diameter: number;
  diameterTop: number;
  diameterBottom: number;
  height: number;
  angle: number;
  minThick: number;
  maxThick: number;
}

export interface ModelOptions {
  backLighted: boolean;
  lightColor: string;
  lightIntensity: number;
  materialColor: string;
  positiveImage: boolean;
  flipImage: boolean;
  mirrorImage: boolean;
  placementHorizontal: number;
  placementVertical: number;
  zoomFactor: number;
}

export interface QualitySettings {
  mmPerPixel: number;
  previewQuality: PreviewQuality;
  curaFix: boolean;
  autoUpdate: boolean;
}

interface AppState {
  // Navigation
  currentPage: 'upload' | 'edit' | 'model';
  setCurrentPage: (page: 'upload' | 'edit' | 'model') => void;

  // Image
  originalImage: string | null;
  setOriginalImage: (image: string) => void;
  processedImageData: ImageData | null;
  setProcessedImageData: (data: ImageData) => void;

  // Settings
  imageSettings: ImageSettings;
  updateImageSettings: (settings: Partial<ImageSettings>) => void;

  greyscaleSettings: GreyscaleSettings;
  updateGreyscaleSettings: (settings: Partial<GreyscaleSettings>) => void;

  cylinderParams: CylinderParams;
  updateCylinderParams: (params: Partial<CylinderParams>) => void;

  modelOptions: ModelOptions;
  updateModelOptions: (options: Partial<ModelOptions>) => void;

  qualitySettings: QualitySettings;
  updateQualitySettings: (settings: Partial<QualitySettings>) => void;

  // Actions
  reset: () => void;
}

const initialImageSettings: ImageSettings = {
  brightness: 0,
  contrast: 0,
  exposure: 0,
  blur: 0,
};

const initialGreyscaleSettings: GreyscaleSettings = {
  method: 'luminance',
  bgIntensity: 0.5,
  redSlider: 0.299,
  greenSlider: 0.587,
  blueSlider: 0.114,
  threshold: 0.5,
  blackFactor: 0.5,
  whiteFactor: 0.5,
};

const initialCylinderParams: CylinderParams = {
  diameter: 74.2,
  diameterTop: 74.2,
  diameterBottom: 74.2,
  height: 115.6,
  angle: 360,
  minThick: 0.5,
  maxThick: 2.8,
};

const initialModelOptions: ModelOptions = {
  backLighted: true,
  lightColor: '#ffffff',
  lightIntensity: 95,
  materialColor: '#ffffff',
  positiveImage: true,
  flipImage: false,
  mirrorImage: false,
  placementHorizontal: 50,
  placementVertical: 50,
  zoomFactor: 100,
};

const initialQualitySettings: QualitySettings = {
  mmPerPixel: 0.1,
  previewQuality: 'medium',
  curaFix: false,
  autoUpdate: true,
};

export const useStore = create<AppState>((set) => ({
  currentPage: 'upload',
  setCurrentPage: (page) => set({ currentPage: page }),

  originalImage: null,
  setOriginalImage: (image) => set({ originalImage: image }),
  processedImageData: null,
  setProcessedImageData: (data) => set({ processedImageData: data }),

  imageSettings: initialImageSettings,
  updateImageSettings: (settings) =>
    set((state) => ({
      imageSettings: { ...state.imageSettings, ...settings },
    })),

  greyscaleSettings: initialGreyscaleSettings,
  updateGreyscaleSettings: (settings) =>
    set((state) => ({
      greyscaleSettings: { ...state.greyscaleSettings, ...settings },
    })),

  cylinderParams: initialCylinderParams,
  updateCylinderParams: (params) =>
    set((state) => ({
      cylinderParams: { ...state.cylinderParams, ...params },
    })),

  modelOptions: initialModelOptions,
  updateModelOptions: (options) =>
    set((state) => ({
      modelOptions: { ...state.modelOptions, ...options },
    })),

  qualitySettings: initialQualitySettings,
  updateQualitySettings: (settings) =>
    set((state) => ({
      qualitySettings: { ...state.qualitySettings, ...settings },
    })),

  reset: () =>
    set({
      currentPage: 'upload',
      originalImage: null,
      processedImageData: null,
      imageSettings: initialImageSettings,
      greyscaleSettings: initialGreyscaleSettings,
      cylinderParams: initialCylinderParams,
      modelOptions: initialModelOptions,
      qualitySettings: initialQualitySettings,
    }),
}));
