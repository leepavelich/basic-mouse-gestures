let gestureInProgress = false;

document.addEventListener('mousedown', (e) => {
  if (e.button === 2) {
    gestureInProgress = true;
    let gesture = [];
    let startX = e.clientX;
    let startY = e.clientY;
    let hasMoved = false;
    const minDistance = 20;
    let lastX = startX;
    let lastY = startY;
    const initialTarget = findAnchorTag(e.target);

    const { trail, ctx } = createTrail();
    ctx.moveTo(startX, startY);

    const moveHandler = (e) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > minDistance) {
        hasMoved = true;

        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0 && gesture[gesture.length - 1] !== 'right') gesture.push('right');
          else if (dx < 0 && gesture[gesture.length - 1] !== 'left') gesture.push('left');
        } else {
          if (dy > 0 && gesture[gesture.length - 1] !== 'down') gesture.push('down');
          else if (dy < 0 && gesture[gesture.length - 1] !== 'up') gesture.push('up');
        }

        lastX = e.clientX;
        lastY = e.clientY;
      }

      ctx.lineTo(e.clientX, e.clientY);
      ctx.stroke();
    };

    const upHandler = (e) => {
      removeTrail(trail);
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);

      if (hasMoved) {
        const gestureStr = gesture.join('-');
        if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ action: 'performGesture', gesture: gestureStr, link: initialTarget?.href || null });
        }
      }
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);

    // Set a short timeout to allow for immediate small movements
    setTimeout(() => {
      if (!hasMoved) {
        removeTrail(trail)

        gestureInProgress = false;
        const newContextMenuEvent = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 2,
          buttons: 2,
          clientX: e.clientX,
          clientY: e.clientY
        });
        e.target.dispatchEvent(newContextMenuEvent);
        e.stopPropagation();
      }
    }, 200);
  }
});

function findAnchorTag(element) {
  while (element && element.tagName !== 'A') {
    element = element.parentElement;
  }
  return element;
}

document.addEventListener('contextmenu', (e) => {
  console.log({ gestureInProgress })
  if (!gestureInProgress) {
    console.log("not prevented")
    return;
  }

  e.preventDefault();
  console.log("prevented")
});