// login.js

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const popup = document.getElementById('popup');
    const popupMessage = document.getElementById('popupMessage');
  
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
  
      const data = await res.json();
  
      if (res.ok) {
        popupMessage.textContent = '✅ Login successful!';
        popup.classList.remove('hidden');
        popup.classList.add('success');
        
        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = 'Profile.html';
        }, 1500);
      } else {
        popupMessage.textContent = `❌ ${data.message || 'Login failed!'}`;
        popup.classList.remove('hidden');
        popup.classList.add('error');
      }
  
    } catch (err) {
      console.error('❌ Login error:', err);
      popupMessage.textContent = '❌ Login request failed!';
      popup.classList.remove('hidden');
      popup.classList.add('error');
    }
  });
  
  // Handle OK button in modal
  document.getElementById('popupCloseBtn')?.addEventListener('click', () => {
    const popup = document.getElementById('popup');
    popup.classList.add('hidden');
    popup.classList.remove('success', 'error');
  });
  
  
  // ================================
  // Zoom Page & Fallback (Merged)
  // ================================
  window.addEventListener("DOMContentLoaded", () => {
    document.body.style.zoom = "140%";
  
    if (!("zoom" in document.body.style)) {
      document.body.style.transform = "scale(0.9)";
      document.body.style.transformOrigin = "top left";
      document.body.style.width = "111.11%";
    }
  });
  