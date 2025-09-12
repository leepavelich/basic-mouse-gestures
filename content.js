let gestureInProgress = false; // RMB is down and we are armed
let hasMoved = false;          // Threshold passed; an actual gesture is active
let gesture = [];
let lastX = 0;
let lastY = 0;
let initialTarget = null;
let activeTrail = null;
let activeCtx = null;
let activeMoveHandler = null;
let activeUpHandler = null;
const minDistance = 20;
let allowNativeMenuByModifier = false; // set when Cmd/Ctrl was held at mousedown

function isEditable(el) {
  if (!el) return false;
  const tag = el.tagName;
  if (!tag) return false;
  const editable = el.isContentEditable;
  return (
    editable ||
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT'
  );
}

function cleanupGesture() {
  if (activeTrail) removeTrail(activeTrail);
  if (activeMoveHandler) document.removeEventListener('mousemove', activeMoveHandler);
  if (activeUpHandler) document.removeEventListener('mouseup', activeUpHandler);
  gestureInProgress = false;
  hasMoved = false;
  gesture = [];
  initialTarget = null;
  activeTrail = null;
  activeCtx = null;
  activeMoveHandler = null;
  activeUpHandler = null;
}

document.addEventListener('mousedown', (e) => {
  if (e.button !== 2) return;
  if (e.metaKey || e.ctrlKey) {
    // Modifier chord requested native menu; ensure no gesture starts
    allowNativeMenuByModifier = true;
    cleanupGesture();
    return;
  }
  allowNativeMenuByModifier = false;
  if (isEditable(e.target)) return;    // don't gesture on inputs/editables

  gestureInProgress = true;
  hasMoved = false;
  gesture = [];
  lastX = e.clientX;
  lastY = e.clientY;
  initialTarget = findAnchorTag(e.target);

  const moveHandler = (e) => {
    if (!gestureInProgress) return;
    if ((e.buttons & 2) !== 2) return; // only while RMB is pressed

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const distance = Math.hypot(dx, dy);

    if (!hasMoved && distance > minDistance) {
      hasMoved = true;
      const created = createTrail();
      activeTrail = created.trail;
      activeCtx = created.ctx;
      activeCtx.moveTo(lastX, lastY);
    }

    if (hasMoved && activeCtx) {
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && gesture[gesture.length - 1] !== 'right') gesture.push('right');
        else if (dx < 0 && gesture[gesture.length - 1] !== 'left') gesture.push('left');
      } else {
        if (dy > 0 && gesture[gesture.length - 1] !== 'down') gesture.push('down');
        else if (dy < 0 && gesture[gesture.length - 1] !== 'up') gesture.push('up');
      }

      lastX = e.clientX;
      lastY = e.clientY;

      activeCtx.lineTo(e.clientX, e.clientY);
      activeCtx.stroke();
    }
  };

  const upHandler = (e) => {
    if (hasMoved) {
      const gestureStr = gesture.join('-');
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'performGesture', gesture: gestureStr, link: initialTarget?.href || null });
      }
    }

    cleanupGesture();
  };

  activeMoveHandler = moveHandler;
  activeUpHandler = upHandler;
  document.addEventListener('mousemove', moveHandler);
  document.addEventListener('mouseup', upHandler);
});

function findAnchorTag(element) {
  while (element && element.tagName !== 'A') {
    element = element.parentElement;
  }
  return element;
}

document.addEventListener('contextmenu', (e) => {
  if (allowNativeMenuByModifier) {
    // Let native menu through for this click; then reset the flag
    allowNativeMenuByModifier = false;
    return;
  }

  // Default RMB is for gestures: suppress the native menu when in RMB flow
  if (gestureInProgress || hasMoved) {
    e.preventDefault();
  }
});
