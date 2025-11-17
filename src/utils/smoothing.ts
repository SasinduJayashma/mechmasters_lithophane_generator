/**
 * Apply smoothing to a 2D grid of values to reduce spikes
 * Uses a gaussian-like weighted average of neighboring cells
 */
export function smoothGrid(
  grid: number[][],
  iterations: number = 1
): number[][] {
  if (iterations === 0) return grid;

  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  if (rows === 0 || cols === 0) return grid;

  let smoothed = grid.map(row => [...row]);

  for (let iter = 0; iter < iterations; iter++) {
    const temp: number[][] = smoothed.map(row => [...row]);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        let sum = 0;
        let weight = 0;

        // 3x3 kernel with gaussian-like weights
        // Center: 4, Adjacent: 2, Diagonal: 1
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            const ni = i + di;
            const nj = j + dj;

            // Check bounds
            if (ni >= 0 && ni < rows && nj >= 0 && nj < cols) {
              let w: number;
              if (di === 0 && dj === 0) {
                w = 4; // Center
              } else if (di === 0 || dj === 0) {
                w = 2; // Adjacent
              } else {
                w = 1; // Diagonal
              }

              sum += smoothed[ni][nj] * w;
              weight += w;
            }
          }
        }

        temp[i][j] = sum / weight;
      }
    }

    smoothed = temp;
  }

  return smoothed;
}

/**
 * Apply smoothing to thickness values in a vertex grid
 * This helps reduce spikes in the lithophane while maintaining detail
 */
export function smoothThicknessValues(
  thicknessGrid: number[][],
  smoothingLevel: number
): number[][] {
  // Convert smoothing level (0-5) to iterations
  const iterations = Math.round(smoothingLevel);

  if (iterations === 0) {
    return thicknessGrid;
  }

  return smoothGrid(thicknessGrid, iterations);
}
