import { useState, useEffect } from 'react';

// Simple in-memory cache for image data
const imageCache = new Map<string, string>();

/**
 * A hook for loading and caching images
 * Returns the cached data URL or the original URL while loading
 */
export function useImageCache(imageUrl: string): string {
  const [cachedUrl, setCachedUrl] = useState<string>(() => {
    // Check if already in cache
    return imageCache.has(imageUrl) ? imageCache.get(imageUrl)! : imageUrl;
  });

  useEffect(() => {
    // If URL is not in cache, fetch and cache it
    if (!imageCache.has(imageUrl) && !imageUrl.startsWith('data:')) {
      // Start with original URL
      setCachedUrl(imageUrl);
      
      const controller = new AbortController();
      const signal = controller.signal;
      
      // Fetch the image
      fetch(imageUrl, { signal })
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch image');
          return response.blob();
        })
        .then(blob => {
          // Convert to data URL
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        })
        .then(dataUrl => {
          // Cache the data URL
          imageCache.set(imageUrl, dataUrl);
          setCachedUrl(dataUrl);
        })
        .catch(error => {
          // On error, just use the original URL
          if (error.name !== 'AbortError') {
            console.error('Error caching image:', error);
          }
        });
      
      // Cleanup on unmount
      return () => {
        controller.abort();
      };
    }
  }, [imageUrl]);

  return cachedUrl;
}

/**
 * Clear the entire image cache
 */
export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * Get image cache size
 */
export function getImageCacheSize(): number {
  let totalSize = 0;
  
  imageCache.forEach(dataUrl => {
    // Estimate size: ~3/4 of the length is actual data
    // (data URLs use base64 which is ~1.33x the size of binary)
    totalSize += Math.round(dataUrl.length * 0.75);
  });
  
  return totalSize;
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Preload images into cache
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  const promises = urls.map(url => {
    if (imageCache.has(url) || url.startsWith('data:')) {
      return Promise.resolve();
    }
    
    return fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch image');
        return response.blob();
      })
      .then(blob => {
        return new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            imageCache.set(url, reader.result as string);
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      })
      .catch(error => {
        console.error('Error preloading image:', error);
      });
  });
  
  return Promise.all(promises);
}