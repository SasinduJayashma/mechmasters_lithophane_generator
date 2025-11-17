# Lithophane Generator

A web application for generating 3D lithophane models from images. Create stunning cylindrical lithophanes that can be 3D printed and used as lampshades.

## Features

### 1. Upload Page
- Simple drag-and-drop or file selection interface
- Supports common image formats (PNG, JPG, GIF)
- Recommended image size: 2874px × 1425px

### 2. Edit Page
- **Greyscaling Options:**
  - **Averaging:** Simple average of RGB channels (0.33R + 0.33G + 0.33B)
  - **Luminance:** Weighted RGB conversion with adjustable sliders
    - Red, Green, Blue sliders (0-1)
    - Default values based on human eye sensitivity
  - **Black & White:** Threshold-based conversion
    - Threshold slider
    - Black and White factor controls
  - Background intensity control for all methods

- **Image Adjustments:**
  - Brightness control (-100 to 100)
  - Contrast enhancement (-100 to 100)
  - Exposure adjustment (-100 to 100)
  - Blur effect (0-10 pixel radius)

### 3. Model Page
- **3D Preview:**
  - Real-time cylindrical lithophane visualization
  - Interactive controls (rotate, zoom, pan)
  - Lighting simulation

- **Cylinder Parameters:**
  - Diameter (20-200mm)
  - Diameter Top (20-200mm) - create tapered lampshades
  - Diameter Bottom (20-200mm)
  - Height (20-300mm)
  - Angle (45-360°) - create partial or full cylinders
  - Min Thickness (0.3-3mm)
  - Max Thickness (0.5-5mm)

- **Model Options:**
  - Back lighting with adjustable color and intensity
  - Material color selection
  - Positive/Negative image toggle
  - Flip and mirror controls
  - Placement adjustments (horizontal/vertical)
  - Zoom factor control

- **STL Export:**
  - Generate printable STL files
  - Ready for 3D printing

## Recommended PLA Thicknesses

Different PLA brands work best with different thickness settings:

- **Esun Cool White PLA:** Min: 0.8mm, Max: 3.0mm
- **Solutech Silver Metal:** Min: 0.6mm, Max: 2.4mm
- **Colorfabb Standard White PLA:** Min: 0.8mm, Max: 3.3mm

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Technology Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Three.js** - 3D rendering
- **React Three Fiber** - React renderer for Three.js
- **Zustand** - State management
- **Tailwind CSS** - Styling

## Usage Tips

1. **Image Selection:** Choose high-contrast images for best results
2. **Greyscaling:** Experiment with different methods to find the best look
3. **Thickness:** Use calibration prints to find optimal thickness for your material
4. **Angle:** Use angles less than 360° to create artistic lampshade designs
5. **Preview:** Always check the 3D preview before downloading the STL

## Printing Tips

- Print with white or translucent filament for best light transmission
- Use 100% infill for uniform light distribution
- Print slowly (40-50mm/s) for best detail
- No support material needed for cylindrical designs
- Consider printing in vase mode for thin, uniform walls

## License

MIT
