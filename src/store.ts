import { create } from 'zustand';

export type GreyscaleMethod = 'averaging' | 'luminance' | 'blackwhite';
export type PreviewQuality = 'lousy' | 'low' | 'medium' | 'high' | 'native';

// LocalStorage helpers
const STORAGE_KEY = 'lithophane-settings';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed[key] !== undefined ? parsed[key] : defaultValue;
    }
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error);
  }
  return defaultValue;
}

function saveToStorage(key: string, value: any) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save settings to localStorage:', error);
  }
}

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
  hasTopCover: boolean;
  hasBottomCover: boolean;
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
  smoothing: number; // 0 = no smoothing, higher values = more smoothing
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

const defaultImageSettings: ImageSettings = {
  brightness: 0,
  contrast: 0,
  exposure: 0,
  blur: 0,
};

const defaultGreyscaleSettings: GreyscaleSettings = {
  method: 'luminance',
  bgIntensity: 0.5,
  redSlider: 0.299,
  greenSlider: 0.587,
  blueSlider: 0.114,
  threshold: 0.5,
  blackFactor: 0.5,
  whiteFactor: 0.5,
};

const defaultCylinderParams: CylinderParams = {
  diameter: 74.2,
  diameterTop: 74.2,
  diameterBottom: 74.2,
  height: 115.6,
  angle: 360,
  minThick: 0.5,
  maxThick: 2.8,
  hasTopCover: true,
  hasBottomCover: true,
};

const defaultModelOptions: ModelOptions = {
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

const defaultQualitySettings: QualitySettings = {
  mmPerPixel: 0.1,
  previewQuality: 'medium',
  curaFix: false,
  autoUpdate: true,
  smoothing: 1,
};

// Load initial values from localStorage or use defaults
const initialImageSettings = loadFromStorage('imageSettings', defaultImageSettings);
const initialGreyscaleSettings = loadFromStorage('greyscaleSettings', defaultGreyscaleSettings);
const initialCylinderParams = loadFromStorage('cylinderParams', defaultCylinderParams);
const initialModelOptions = loadFromStorage('modelOptions', defaultModelOptions);
const initialQualitySettings = loadFromStorage('qualitySettings', defaultQualitySettings);

export const useStore = create<AppState>((set) => ({
  currentPage: 'upload',
  setCurrentPage: (page) => set({ currentPage: page }),

  originalImage: null,
  setOriginalImage: (image) => set({ originalImage: image }),
  processedImageData: null,
  setProcessedImageData: (data) => set({ processedImageData: data }),

  imageSettings: initialImageSettings,
  updateImageSettings: (settings) =>
    set((state) => {
      const newSettings = { ...state.imageSettings, ...settings };
      saveToStorage('imageSettings', newSettings);
      return { imageSettings: newSettings };
    }),

  greyscaleSettings: initialGreyscaleSettings,
  updateGreyscaleSettings: (settings) =>
    set((state) => {
      const newSettings = { ...state.greyscaleSettings, ...settings };
      saveToStorage('greyscaleSettings', newSettings);
      return { greyscaleSettings: newSettings };
    }),

  cylinderParams: initialCylinderParams,
  updateCylinderParams: (params) =>
    set((state) => {
      const newParams = { ...state.cylinderParams, ...params };
      saveToStorage('cylinderParams', newParams);
      return { cylinderParams: newParams };
    }),

  modelOptions: initialModelOptions,
  updateModelOptions: (options) =>
    set((state) => {
      const newOptions = { ...state.modelOptions, ...options };
      saveToStorage('modelOptions', newOptions);
      return { modelOptions: newOptions };
    }),

  qualitySettings: initialQualitySettings,
  updateQualitySettings: (settings) =>
    set((state) => {
      const newSettings = { ...state.qualitySettings, ...settings };
      saveToStorage('qualitySettings', newSettings);
      return { qualitySettings: newSettings };
    }),

  reset: () => {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
    // Reset to defaults
    set({
      currentPage: 'upload',
      originalImage: null,
      processedImageData: null,
      imageSettings: defaultImageSettings,
      greyscaleSettings: defaultGreyscaleSettings,
      cylinderParams: defaultCylinderParams,
      modelOptions: defaultModelOptions,
      qualitySettings: defaultQualitySettings,
    });
  },
}));
