// Initialize theme
function initTheme() {
  const stored = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', stored);
  if (stored === 'dark') {
    document.documentElement.classList.add('dark');
  }
}

// Toggle theme
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = current === 'light' ? 'dark' : 'light';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);

  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Dispatch event for any listeners
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
}

// Initialize on page load
initTheme();
