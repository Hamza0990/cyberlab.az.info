/**
 * Vercel Speed Insights initialization
 * This script loads and initializes Speed Insights for performance monitoring
 */
(function() {
  'use strict';
  
  // Initialize the queue for Speed Insights
  if (window.si) return;
  window.si = function() {
    (window.siq = window.siq || []).push(arguments);
  };

  // Create and inject the Speed Insights script
  var script = document.createElement('script');
  script.src = '/_vercel/speed-insights/script.js';
  script.defer = true;
  script.dataset.sdkn = '@vercel/speed-insights';
  script.dataset.sdkv = '2.1.0';
  
  script.onerror = function() {
    console.log('[Vercel Speed Insights] Failed to load script. Please check if any content blockers are enabled.');
  };
  
  document.head.appendChild(script);
})();
