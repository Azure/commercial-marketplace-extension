/**
 * Toast notification system for the marketplace extension
 */

// Create the toast container if it doesn't exist
function createToastContainer() {
  let container = document.getElementById('marketplace-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'marketplace-toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }
  return container;
}

// Show a toast notification
function showToast(message, type = 'success', duration = 3000) {
  const container = createToastContainer();
  
  // Clear existing toasts of the same type for loading messages
  if (type === 'info' && (message.includes('Copying') || message.includes('Pasting'))) {
    const existingToasts = container.querySelectorAll('.marketplace-toast-info');
    existingToasts.forEach(toast => toast.remove());
  }
  
  const toast = document.createElement('div');
  toast.className = `marketplace-toast marketplace-toast-${type}`;
  
  // Get the appropriate icon based on type
  const iconMap = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };
  
  const icon = iconMap[type] || iconMap.info;
  
  toast.innerHTML = `
    <button class="marketplace-toast-close" onclick="this.parentElement.remove()">×</button>
    <div class="marketplace-toast-content">
      <span class="marketplace-toast-icon">${icon}</span>
      <span class="marketplace-toast-message">${message}</span>
    </div>
  `;
  
  // Apply styles
  toast.style.cssText = `
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
    color: white;
    padding: 12px 32px 12px 16px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 14px;
    min-width: 300px;
    max-width: 400px;
    word-wrap: break-word;
    pointer-events: auto;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease-in-out;
    position: relative;
  `;
  
  const contentStyles = `
    .marketplace-toast-content {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 8px;
    }
    .marketplace-toast-icon {
      font-size: 16px;
      flex-shrink: 0;
    }
    .marketplace-toast-message {
      flex: 1;
      line-height: 1.4;
    }
    .marketplace-toast-close {
      position: absolute;
      top: 2px;
      right: -46px;
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      font-weight: bold;
      cursor: pointer;
      padding: 0;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s;
      flex-shrink: 0;
      z-index: 1;
      line-height: 1;
    }
    .marketplace-toast-close:hover {
      opacity: 0.7;
    }
  `;
  
  // Add styles to the page if not already added
  if (!document.getElementById('marketplace-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'marketplace-toast-styles';
    style.textContent = contentStyles;
    document.head.appendChild(style);
  }
  
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  }, 10);
  
  // Auto-hide after duration
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 300);
  }, duration);
}

// Export the function for use in content scripts
window.showMarketplaceToast = showToast;
