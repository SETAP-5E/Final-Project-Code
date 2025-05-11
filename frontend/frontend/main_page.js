// ================================
// Zoom Page & Fallback (Merged)
// ================================
window.addEventListener("DOMContentLoaded", () => {
    document.body.style.zoom = "140%";
  
    // Optional fallback for older browsers
    if (!("zoom" in document.body.style)) {
      document.body.style.transform = "scale(0.9)";
      document.body.style.transformOrigin = "top left";
      document.body.style.width = "111.11%";
    }
  });