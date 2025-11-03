(function () {
  // نجيب بيانات الأدمن من localStorage
  const adminUser = JSON.parse(localStorage.getItem('adminUser'));
  const body = document.body;

  // نتحقق إذا ما فماش admin ولا ما عندوش رتبة admin
  if (!adminUser || !adminUser.roles || !adminUser.roles.includes("admin")) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
    overlay.style.color = 'white';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = 9999;
    overlay.style.fontSize = '1.5rem';
    overlay.style.textAlign = 'center';
    overlay.style.padding = '20px';
    overlay.innerHTML = `
      <p>🚫 You must be logged in as Admin to access this page.</p>
      <button id="goLoginBtn" style="
        margin-top:20px;
        padding:10px 20px;
        font-size:1rem;
        cursor:pointer;
        border:none;
        border-radius:8px;
        background:#1e90ff;
        color:white;
      ">Go to Admin Login</button>
    `;

    body.innerHTML = '';
    body.appendChild(overlay);

    document.getElementById('goLoginBtn').addEventListener('click', () => {
      window.location.href = '/admin-login.html';
    });
  }
})();