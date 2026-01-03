
export function loadGoogleMaps(): Promise<void> {
  if (window.google && window.google.maps && window.google.maps.visualization) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS}&libraries=visualization`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps script loaded');
      // Wait a bit for the visualization library to be fully loaded
      setTimeout(() => {
        if (window.google?.maps?.visualization) {
          console.log('Visualization library confirmed loaded');
          resolve();
        } else {
          console.error('Visualization library not available after load');
          reject(new Error('Visualization library not loaded'));
        }
      }, 100);
    };
    script.onerror = (error) => {
      console.error('Failed to load Google Maps script:', error);
      reject(error);
    };
    document.head.appendChild(script);
  });
}