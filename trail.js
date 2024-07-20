function createTrail() {
  const trail = document.createElement('canvas');
  trail.style.position = 'fixed';
  trail.style.top = '0';
  trail.style.left = '0';
  trail.style.zIndex = '9999';
  trail.width = window.innerWidth;
  trail.height = window.innerHeight;
  const ctx = trail.getContext('2d');
  ctx.strokeStyle = 'blue';
  ctx.lineWidth = 2;
  document.body.appendChild(trail);
  return { trail, ctx };
}

function removeTrail(trail) {
  if (trail.parentNode === document.body) {
    document.body.removeChild(trail);
  }
}
