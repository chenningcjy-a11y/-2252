import * as THREE from 'three';

/**
 * Creates procedural canvas-based PBR textures for the 3D athletic human model
 * Zero external assets required, instant generation, high visual fidelity.
 */

// 1. High-Performance Athletic Compression Weave Texture
export function createCompressionFabricTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Dark carbon/navy base
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 256, 256);

  // Micro honeycomb / diamond compression mesh pattern
  ctx.lineWidth = 1;
  const size = 8;
  for (let y = 0; y < 256; y += size) {
    for (let x = 0; x < 256; x += size) {
      const isEven = ((x / size) + (y / size)) % 2 === 0;
      ctx.fillStyle = isEven ? '#1e2b40' : '#141e2e';
      ctx.fillRect(x, y, size, size);

      // Fine highlight dot in center
      ctx.fillStyle = isEven ? '#334155' : '#0f172a';
      ctx.fillRect(x + size / 2 - 1, y + size / 2 - 1, 2, 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

// 2. High-Fidelity Gym Training Mat Texture with Grid Lines and Stippling
export function createGymMatTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Gradient deep athletic teal/slate
  const gradient = ctx.createLinearGradient(0, 0, 512, 1024);
  gradient.addColorStop(0, '#0369a1');
  gradient.addColorStop(0.5, '#0284c7');
  gradient.addColorStop(1, '#075985');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 1024);

  // Subtle stipple noise for high-friction texture
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let i = 0; i < 6000; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 1024;
    ctx.fillRect(rx, ry, 2, 2);
  }

  // Outer border trim
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
  ctx.lineWidth = 8;
  ctx.strokeRect(12, 12, 512 - 24, 1024 - 24);

  // Center Biomechanical Alignment Guide Line (Central Axis)
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.setLineDash([16, 8]);
  ctx.beginPath();
  ctx.moveTo(256, 30);
  ctx.lineTo(256, 1024 - 30);
  ctx.stroke();
  ctx.setLineDash([]);

  // 45° contralateral alignment marks for hands and knees
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.35)';
  ctx.lineWidth = 2;
  const markingsY = [250, 512, 750];
  markingsY.forEach((y) => {
    ctx.beginPath();
    ctx.arc(256, y, 40, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(120, y);
    ctx.lineTo(392, y);
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 3. Realistic Athletic Shoe Outsole Grip Texture
export function createShoeSoleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 128, 256);

  // Hexagonal rubber traction lugs
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3;
  for (let y = 16; y < 256; y += 24) {
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(64, y + 10);
    ctx.lineTo(112, y);
    ctx.stroke();
  }

  // Pivot circle on forefoot
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(64, 70, 18, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
