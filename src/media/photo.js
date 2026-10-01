export async function loadImage(src) {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}
export async function resizePhoto(file) {
  if (file.size > 20 * 1024 * 1024) throw new Error('사진은 20MB 이하로 선택해 주세요.');
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일을 선택해 주세요.');
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.88);
  } catch {
    throw new Error('사진을 열 수 없어요. JPG, PNG 또는 WebP 사진을 선택해 주세요.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
