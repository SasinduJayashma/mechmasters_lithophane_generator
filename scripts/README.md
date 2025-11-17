# Lithophane Generator - Automation Script

Batch generate lithophanes from the command line without using the web UI.

## Installation

First, install dependencies (includes `canvas` for image processing):

```bash
npm install
```

## Usage

```bash
npm run generate -- <input-image> [output-file] [options]
```

Or directly:

```bash
node scripts/generate-lithophane.js <input-image> [output-file] [options]
```

## Examples

### Basic usage (with defaults)
```bash
npm run generate -- photo.jpg
# Output: lithophane.stl
```

### Specify output file
```bash
npm run generate -- photo.jpg my-lithophane.stl
```

### High quality lithophane
```bash
npm run generate -- photo.jpg output.stl --quality=0.05 --smoothing=2
```

### Custom dimensions
```bash
npm run generate -- photo.jpg output.stl --diameter=100 --height=150
```

### All options
```bash
npm run generate -- photo.jpg output.stl \
  --quality=0.1 \
  --smoothing=1 \
  --diameter=74.2 \
  --height=115.6 \
  --min-thick=0.5 \
  --max-thick=2.8
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--quality=<mm>` | mm per pixel (lower = higher quality, larger file) | 0.1 |
| `--smoothing=<level>` | Surface smoothing level (0-5) | 1 |
| `--diameter=<mm>` | Cylinder diameter | 74.2 |
| `--height=<mm>` | Cylinder height | 115.6 |
| `--min-thick=<mm>` | Minimum wall thickness | 0.5 |
| `--max-thick=<mm>` | Maximum wall thickness | 2.8 |

## Batch Processing

Process multiple images:

```bash
#!/bin/bash
for img in images/*.jpg; do
  basename=$(basename "$img" .jpg)
  npm run generate -- "$img" "output/${basename}.stl" --quality=0.1 --smoothing=1
done
```

## Output

The script generates a binary STL file ready for 3D printing in Cura, PrusaSlicer, or any other slicer.

## Default Settings

The automation script uses the same defaults as the web app:

- **Greyscale Method:** Luminance (0.299R + 0.587G + 0.114B)
- **Brightness/Contrast/Exposure:** 0 (no adjustments)
- **Cylinder:** 74.2mm diameter × 115.6mm height, 360° angle
- **Thickness:** 0.5mm min, 2.8mm max
- **Quality:** 0.1mm per pixel
- **Smoothing:** Level 1 (reduces spikes)
- **Image:** Positive (not inverted)

## Performance

Generation speed depends on quality settings:

- **Low quality** (1.0mm/pixel): ~10 seconds
- **Medium quality** (0.1mm/pixel): ~30 seconds
- **High quality** (0.05mm/pixel): ~2 minutes

File sizes:

- 1.0mm/pixel: ~5 MB
- 0.1mm/pixel: ~40 MB
- 0.05mm/pixel: ~160 MB

## Tips

1. **Start with defaults** to test, then adjust quality
2. **Use smoothing=1 or 2** to prevent printing spikes
3. **Keep files under 480 MB** for Cura compatibility
4. **Test with low quality first** to verify dimensions before high-quality export

## Troubleshooting

### "Cannot find module 'canvas'"
Run `npm install` to install dependencies

### "File size too large"
Increase `--quality` value (use larger mm/pixel)

### "Out of memory"
Reduce quality or process smaller images

## Integration

The script can be integrated into:

- **Build pipelines** (CI/CD)
- **Batch processing** (process entire folders)
- **Custom workflows** (combined with image editing tools)
- **Server-side generation** (headless lithophane generation)
