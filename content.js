let gestureInProgress = false; // RMB is down and we are armed
let hasMoved = false;          // Threshold passed; an actual gesture is active
let gesture = [];
let startX = 0;
let startY = 0;
let turnAnchorX = 0;
let turnAnchorY = 0;
let initialTarget = null;
let activeTrail = null;
let activeCtx = null;
let activeMoveHandler = null;
let activeUpHandler = null;
let activeBlurHandler = null;
const minDistance = 16;
const turnDistance = 12;
const dominanceRatio = 1.5; // winning axis must beat the other by 50%
let allowNativeMenuByModifier = false; // set when Cmd/Ctrl was held at mousedown

// macOS fires contextmenu on mousedown, before any drag exists, so the menu
// can't be gated on whether a gesture happened. Windows/Linux fire it after
// mouseup, where it can.
const isMac = /Mac/.test(navigator.platform) || /Macintosh/.test(navigator.userAgent);
let suppressMenuUntil = 0;    // Windows/Linux: eat the contextmenu that follows a gesture
let lastPlainRightClick = 0;  // macOS: when a right-click ended without movement
const menuSecondClickMs = 500;

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
  if (activeBlurHandler) window.removeEventListener('blur', activeBlurHandler);
  gestureInProgress = false;
  hasMoved = false;
  gesture = [];
  initialTarget = null;
  activeTrail = null;
  activeCtx = null;
  activeMoveHandler = null;
  activeUpHandler = null;
  activeBlurHandler = null;
}

function getDominantDirection(dx, dy) {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx > absDy * dominanceRatio) {
    return dx > 0 ? 'right' : 'left';
  }

  if (absDy > absDx * dominanceRatio) {
    return dy > 0 ? 'down' : 'up';
  }

  return null; // too diagonal to call; keep accumulating
}

document.addEventListener('mousedown', (e) => {
  if (e.button !== 2) return;
  if (e.metaKey || e.ctrlKey) {
    // Modifier chord requested native menu; ensure no gesture starts
    allowNativeMenuByModifier = true;
    cleanupGesture();
    return;
  }
  cleanupGesture();
  allowNativeMenuByModifier = false;
  if (isEditable(e.target)) return;    // don't gesture on inputs/editables

  gestureInProgress = true;
  hasMoved = false;
  gesture = [];
  startX = e.clientX;
  startY = e.clientY;
  turnAnchorX = e.clientX;
  turnAnchorY = e.clientY;
  initialTarget = findAnchorTag(e.target);

  const moveHandler = (e) => {
    if (!gestureInProgress) return;
    if ((e.buttons & 2) !== 2) {
      cleanupGesture();
      return;
    }

    const startDx = e.clientX - startX;
    const startDy = e.clientY - startY;
    const distance = Math.hypot(startDx, startDy);

    if (!hasMoved && distance > minDistance) {
      hasMoved = true;
      const created = createTrail();
      activeTrail = created.trail;
      activeCtx = created.ctx;
      activeCtx.moveTo(startX, startY);
    }

    if (hasMoved && activeCtx) {
      const turnDx = e.clientX - turnAnchorX;
      const turnDy = e.clientY - turnAnchorY;
      const turnTravel = Math.hypot(turnDx, turnDy);

      if (turnTravel >= turnDistance) {
        const nextDirection = getDominantDirection(turnDx, turnDy);
        if (nextDirection) {
          if (gesture[gesture.length - 1] !== nextDirection) {
            gesture.push(nextDirection);
          }

          turnAnchorX = e.clientX;
          turnAnchorY = e.clientY;
        }
      }

      activeCtx.lineTo(e.clientX, e.clientY);
      activeCtx.stroke();
    }
  };

  const upHandler = () => {
    if (hasMoved) {
      // A gesture just happened; on Windows/Linux the contextmenu event is
      // about to fire, so flag it for suppression
      suppressMenuUntil = performance.now() + 300;
      const gestureStr = gesture.join('-');
      if (gestureStr && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'performGesture', gesture: gestureStr, link: initialTarget?.href || null });
      }
    } else if (isMac) {
      // Right-click with no movement: arm the second-click menu passthrough
      lastPlainRightClick = performance.now();
    }

    cleanupGesture();
  };

  activeMoveHandler = moveHandler;
  activeUpHandler = upHandler;
  activeBlurHandler = cleanupGesture;
  document.addEventListener('mousemove', moveHandler);
  document.addEventListener('mouseup', upHandler);
  window.addEventListener('blur', activeBlurHandler);
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

  if (isMac) {
    // This event fired at mousedown, so we can't yet know whether the click
    // will become a gesture. A second right-click shortly after a plain one
    // opens the menu; anything else is treated as a (potential) gesture.
    if (performance.now() - lastPlainRightClick < menuSecondClickMs) {
      lastPlainRightClick = 0;
      cleanupGesture(); // the menu is opening; don't leave a gesture armed
      return;
    }
    if (gestureInProgress || hasMoved) {
      e.preventDefault();
    }
    return;
  }

  // Windows/Linux: this event fired after mouseup, so by now we know whether
  // a gesture happened. Plain clicks get the native menu.
  if (performance.now() < suppressMenuUntil) {
    suppressMenuUntil = 0;
    e.preventDefault();
  }
});
