/**
 * Vercel Speed Insights Loader for CyberLab
 * Loads the Speed Insights tracking for the website
 */

// Initialize the queue
window.si = window.si || function() {
  (window.siq = window.siq || []).push(arguments);
};

// Load the actual Speed Insights script
(function() {
  var script = document.createElement('script');
  script.src = '/_vercel/speed-insights/script.js';
  script.defer = true;
  script.dataset.sdkn = '@vercel/speed-insights';
  script.dataset.sdkv = '2.0.0';
  
  // Only load on production (Vercel deployment)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    document.head.appendChild(script);
  }
})();
