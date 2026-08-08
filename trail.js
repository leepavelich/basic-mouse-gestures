function createTrail() {
  const trail = document.createElement('canvas');
  trail.style.position = 'fixed';
  trail.style.top = '0';
  trail.style.left = '0';
  trail.style.width = '100%';
  trail.style.height = '100%';
  trail.style.zIndex = '2147483647';
  trail.style.pointerEvents = 'none';
  const dpr = window.devicePixelRatio || 1;
  trail.width = window.innerWidth * dpr;
  trail.height = window.innerHeight * dpr;
  const ctx = trail.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.strokeStyle = 'blue';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  (document.body || document.documentElement).appendChild(trail);
  return { trail, ctx };
}

function removeTrail(trail) {
  if (trail.parentNode) {
    trail.parentNode.removeChild(trail);
  }
}
