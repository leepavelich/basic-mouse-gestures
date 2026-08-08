# Basic Mouse Gestures

A basic mouse gesture extension for Chrome:

- `L` - Go back
- `R` - Go forward
- `U` - Open a new tab or link (foreground)
- `D` - Open a new tab or link (background)
- `DR` - Close tab

## Context menu

- **Windows/Linux**: a plain right-click opens the native menu; it is only suppressed when a gesture was drawn.
- **macOS**: the `contextmenu` event fires on mousedown (before a drag can be detected), so the menu can't be gated on movement. Right-click twice quickly to open the menu, or hold Cmd/Ctrl while right-clicking.
