// Text advance widths include font-specific whitespace. Center visible pixels instead.
export function alphaBounds({ data, width, height }) {
  let left = width,
    top = height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  return right < left
    ? null
    : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

export function centeredDestination(bounds, centerX, centerY) {
  return { x: centerX - bounds.width / 2, y: centerY - bounds.height / 2 };
}

export function createIconRenderer(target) {
  // Cache only within this export so changes in loaded fonts cannot stale the bounds.
  const cache = new Map();
  return function icon(symbol, centerX, centerY, size, color = '#20221d') {
    const key = `${symbol}:${size}:${color}`;
    if (!cache.has(key)) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = Math.ceil(size * 3);
      const context = canvas.getContext('2d');
      context.font = `500 ${size}px "Manrope", "Noto Sans KR", sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = color;
      context.fillText(symbol, canvas.width / 2, canvas.height / 2);
      const bounds = alphaBounds(context.getImageData(0, 0, canvas.width, canvas.height));
      cache.set(key, { canvas, bounds });
    }
    const { canvas, bounds } = cache.get(key);
    if (!bounds) return;
    const destination = centeredDestination(bounds, centerX, centerY);
    target.drawImage(
      canvas,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      destination.x,
      destination.y,
      bounds.width,
      bounds.height,
    );
  };
}
