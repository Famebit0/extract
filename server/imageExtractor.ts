import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { Image, imageSchema, imageFormatEnum, ImageFormat } from "@shared/schema";
import { URL } from "url";
import path from "path";
import * as stream from "stream";
import { promisify } from "util";
import { MIME_TO_FORMAT_MAP, FORMAT_TO_MIME_MAP, USER_AGENTS } from "./constants";

// Custom error classes for better error handling
class ExtractorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractorError";
  }
}

class NetworkError extends ExtractorError {
  statusCode?: number;
  
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "NetworkError";
    this.statusCode = statusCode;
  }
}

class FormatError extends ExtractorError {
  format: string;
  
  constructor(message: string, format: string) {
    super(message);
    this.name = "FormatError";
    this.format = format;
  }
}

class ImageExtractor {
  // Track the number of requests to implement rate limiting
  private requestCount: number = 0;
  private lastRequestTime: number = Date.now();
  private readonly MAX_REQUESTS_PER_MINUTE: number = 20;
  private pipeline = promisify(stream.pipeline);
  
  /**
   * Extract images from a URL
   * @param url The URL to extract images from
   * @returns An array of extracted images
   */
  async extractImagesFromUrl(url: string): Promise<Image[]> {
    try {
      // Implement rate limiting
      await this.rateLimit();
      
      console.log(`Starting extraction from URL: ${url}`);
      
      // Add http/https if missing
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }
      
      // Extract images using enhanced Cheerio approach
      return await this.extractWithEnhancedCheerio(url);
    } catch (error) {
      console.error('Error extracting images:', error instanceof Error ? error.stack : error);
      
      if (error instanceof NetworkError) {
        throw error;
      } else if (error instanceof FormatError) {
        throw error;
      } else if (error instanceof Error) {
        throw new ExtractorError(`Image extraction failed: ${error.message}`);
      } else {
        throw new ExtractorError('Unknown error during image extraction');
      }
    }
  }
  
  /**
   * Add an image from a URL to the collection
   */
  private addImageFromUrl(imageUrl: string, options: {
    pageUrl: string,
    baseUrl: string,
    alt?: string,
    width?: number,
    height?: number,
    sourceType?: string,
    isLazyLoaded?: boolean,
    originalElement?: string,
    dataSrc?: string,
    mimeType?: string,
    isResponsive?: boolean
  }, allImages: Image[]): void {
    try {
      // Skip data URIs unless they're small
      if (imageUrl.startsWith('data:') && imageUrl.length > 500) {
        return;
      }
      
      // Resolve to absolute URL
      const absoluteUrl = this.resolveUrl(options.baseUrl || options.pageUrl, imageUrl);
      if (!absoluteUrl) return;
      
      // Skip invalid or empty URLs
      if (!absoluteUrl.match(/^https?:\/\//i)) return;
      
      // Extract filename and format information
      const filename = this.getFilenameFromUrl(absoluteUrl);
      if (!filename) return;
      
      const extension = path.extname(filename).toLowerCase().slice(1);
      let format: ImageFormat = 'unknown';
      let mimeType: string | undefined = options.mimeType;
      
      // Try to determine format from extension
      if (extension) {
        // Check if it's a known image format
        if (extension in FORMAT_TO_MIME_MAP) {
          format = extension as ImageFormat;
          mimeType = FORMAT_TO_MIME_MAP[extension];
        }
      }
      
      // If we have a mimeType but not a format, try to determine format from mimeType
      if (mimeType && format === 'unknown') {
        for (const [mime, fmt] of Object.entries(MIME_TO_FORMAT_MAP)) {
          if (mimeType === mime) {
            format = fmt;
            break;
          }
        }
      }
      
      // Calculate aspect ratio if we have both width and height
      let aspectRatio: number | undefined;
      if (options.width && options.height && options.width > 0 && options.height > 0) {
        aspectRatio = options.width / options.height;
      }
      
      // Create the image object
      try {
        const image: Image = imageSchema.parse({
          url: absoluteUrl,
          filename,
          width: options.width,
          height: options.height,
          alt: options.alt,
          type: mimeType || `image/${format !== 'unknown' ? format : 'jpeg'}`,
          format,
          sourceType: options.sourceType || 'img',
          mimeType,
          aspectRatio,
          isResponsive: options.isResponsive,
          isLazyLoaded: options.isLazyLoaded,
          dataSrc: options.dataSrc,
          originalElement: options.originalElement?.substring(0, 300) // Limit size
        });
        
        allImages.push(image);
      } catch (error) {
        console.warn(`Failed to parse image schema for ${absoluteUrl}:`, error);
      }
    } catch (error) {
      console.warn(`Failed to process image ${imageUrl}:`, error);
    }
  }

  /**
   * Extract images using an enhanced Cheerio implementation
   * This method includes detection for lazy-loaded images and comprehensive format support
   * @param url The URL to extract images from
   * @returns An array of extracted images
   */
  private async extractWithEnhancedCheerio(url: string): Promise<Image[]> {
    try {
      // Set custom headers to avoid being blocked
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Parse the HTML with cheerio
      const $ = cheerio.load(html);
      const baseUrl = new URL(url);
      const images: Image[] = [];
      
      // Find all img tags (including lazy-loaded images)
      $('img').each((_, element) => {
        try {
          // Check for various lazy-loading image attributes common across many sites
          const possibleSources = [
            $(element).attr('src'),
            $(element).attr('data-src'),
            $(element).attr('data-lazy-src'),
            $(element).attr('data-original'),
            $(element).attr('data-srcset'),
            $(element).attr('data-original-src'),
            $(element).attr('data-fallback-src'),
            $(element).attr('srcset')
          ].filter(Boolean);
          
          for (const src of possibleSources) {
            if (!src) continue;
            
            // For srcset, extract the first URL
            const srcUrls = src.includes(',') 
              ? src.split(',').map(s => s.trim().split(' ')[0])
              : [src];
            
            for (const sourceUrl of srcUrls) {
              try {
                if (!sourceUrl) continue;
                
                // Resolve relative URLs
                const imageUrl = this.resolveUrl(baseUrl.href, sourceUrl);
                
                // Get attributes
                const alt = $(element).attr('alt') || '';
                const width = parseInt($(element).attr('width') || '0', 10) || undefined;
                const height = parseInt($(element).attr('height') || '0', 10) || undefined;
                
                // Get filename from URL
                const filename = this.getFilenameFromUrl(imageUrl);
                
                // Create image object and validate with schema
                // Extract extension from filename to avoid undefined issues
                const fileExt = path.extname(filename);
                const type = fileExt ? fileExt.slice(1).toUpperCase() : undefined;
                
                const image: Image = imageSchema.parse({
                  url: imageUrl,
                  filename,
                  width,
                  height,
                  alt,
                  // Size and type will be determined on download
                  size: undefined,
                  type
                });
                
                images.push(image);
              } catch (srcError) {
                // Skip this particular source URL
                console.error(`Error processing image source:`, srcError);
              }
            }
          }
        } catch (error) {
          console.error('Error parsing image:', error);
          // Continue with next image
        }
      });
      
      // Find all picture elements with source tags
      $('picture source, video source').each((_, element) => {
        try {
          const srcset = $(element).attr('srcset');
          const src = $(element).attr('src');
          const dataSrc = $(element).attr('data-src');
          
          // Process srcset if it exists
          if (srcset) {
            const srcsetUrls = srcset.split(',').map(s => s.trim().split(' ')[0]);
            
            // Filter out empty values first
            const validUrls = srcsetUrls.filter(src => !!src);
            
            for (let i = 0; i < validUrls.length; i++) {
              const src = validUrls[i];
              const imageUrl = this.resolveUrl(baseUrl.href, src);
              const filename = this.getFilenameFromUrl(imageUrl);
              
              // Extract extension from filename
              const fileExt = path.extname(filename);
              const type = fileExt ? fileExt.slice(1).toUpperCase() : undefined;
              
              try {
                const image: Image = imageSchema.parse({
                  url: imageUrl,
                  filename,
                  // Size and type will be determined on download
                  type
                });
                
                images.push(image);
              } catch (parseError) {
                console.error('Error parsing image schema:', parseError);
              }
            }
          }
          
          // Process src or data-src if they exist
          const sourceUrl = src || dataSrc;
          if (sourceUrl) {
            try {
              const imageUrl = this.resolveUrl(baseUrl.href, sourceUrl);
              const filename = this.getFilenameFromUrl(imageUrl);
              
              // Safe extraction of extension
              const fileExt = path.extname(filename);
              const type = fileExt ? fileExt.slice(1).toUpperCase() : undefined;
              
              const image: Image = imageSchema.parse({
                url: imageUrl,
                filename,
                // Size and type will be determined on download
                type
              });
              
              images.push(image);
            } catch (parseError) {
              console.error('Error processing image source:', parseError);
            }
          }
        } catch (error) {
          console.error('Error parsing picture/video source:', error);
          // Continue with next source
        }
      });
      
      // Find background images in style attributes and inline styles
      $('[style*="background-image"], [style*="background"], [data-background], [data-bg]').each((_, element) => {
        try {
          // Check style attribute
          const style = $(element).attr('style');
          if (style) {
            const bgMatches = style.match(/background(-image)?:\s*url\(['"]?([^'"()]+)['"]?\)/i);
            if (bgMatches && bgMatches[2]) {
              try {
                const imageUrl = this.resolveUrl(baseUrl.href, bgMatches[2]);
                const filename = this.getFilenameFromUrl(imageUrl);
                
                // Safe extension extraction
                const fileExt = path.extname(filename);
                const type = fileExt ? fileExt.slice(1).toUpperCase() : undefined;
                
                const image: Image = imageSchema.parse({
                  url: imageUrl,
                  filename,
                  // Size and type will be determined on download
                  type
                });
                
                images.push(image);
              } catch (parseError) {
                console.error('Error processing background image:', parseError);
              }
            }
          }
          
          // Check data-background attribute (common in some lazy-loading libraries)
          const dataBg = $(element).attr('data-background') || $(element).attr('data-bg');
          if (dataBg) {
            try {
              const imageUrl = this.resolveUrl(baseUrl.href, dataBg);
              const filename = this.getFilenameFromUrl(imageUrl);
              
              // Safe extension extraction
              const fileExt = path.extname(filename);
              const type = fileExt ? fileExt.slice(1).toUpperCase() : undefined;
              
              const image: Image = imageSchema.parse({
                url: imageUrl,
                filename,
                // Size and type will be determined on download
                type
              });
              
              images.push(image);
            } catch (parseError) {
              console.error('Error processing data-background image:', parseError);
            }
          }
        } catch (error) {
          console.error('Error parsing background image:', error);
          // Continue with next element
        }
      });
      
      // Find CSS background images in style tags and link tags
      $('style, link[rel="stylesheet"]').each((_, element) => {
        try {
          // For style tags, extract CSS content directly
          if (element.tagName === 'style') {
            const css = $(element).html();
            if (!css) {
              return;
            }
            
            const urlMatches = css.match(/url\(['"]?([^'"()]+)['"]?\)/ig);
            if (urlMatches) {
              // Process each URL match safely
              for (let i = 0; i < urlMatches.length; i++) {
                const urlMatch = urlMatches[i];
                const urlParse = urlMatch.match(/url\(['"]?([^'"()]+)['"]?\)/i);
                
                if (urlParse && urlParse[1]) {
                  const urlValue = urlParse[1];
                  
                  // Skip font files and non-image resources 
                  if (urlValue.match(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)) {
                    continue;
                  }
                  
                  try {
                    const imageUrl = this.resolveUrl(baseUrl.href, urlValue);
                    const filename = this.getFilenameFromUrl(imageUrl);
                    
                    // Safe extension extraction
                    const fileExt = path.extname(filename);
                    const type = fileExt ? fileExt.slice(1).toUpperCase() : undefined;
                    
                    const image: Image = imageSchema.parse({
                      url: imageUrl,
                      filename,
                      // Size and type will be determined on download
                      type
                    });
                    
                    images.push(image);
                  } catch (parseError) {
                    console.error('Error processing CSS image URL:', parseError);
                  }
                }
              }
            }
          }
          
          // For link tags, we won't attempt to load external stylesheets here
          // We'll simply extract the href as a potential resource
          if (element.tagName === 'link') {
            const href = $(element).attr('href');
            if (href && href.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i)) {
              try {
                const imageUrl = this.resolveUrl(baseUrl.href, href);
                const filename = this.getFilenameFromUrl(imageUrl);
                
                // Safe extension extraction
                const fileExt = path.extname(filename);
                const type = fileExt ? fileExt.slice(1).toUpperCase() : undefined;
                
                const image: Image = imageSchema.parse({
                  url: imageUrl,
                  filename,
                  type
                });
                
                images.push(image);
              } catch (parseError) {
                console.error('Error processing link href as image:', parseError);
              }
            }
          }
        } catch (error) {
          console.error('Error parsing CSS:', error);
          // Continue with next style/link tag
        }
      });
      
      // Remove duplicate images based on URL
      const uniqueImages = this.removeDuplicates(images);
      
      // Fetch image metadata (size, exact dimensions) for the first 50 images
      // to avoid overwhelming the server and client
      const imagesWithMetadata = await this.fetchImageMetadata(
        uniqueImages.slice(0, 50)
      );
      
      return imagesWithMetadata;
    } catch (error) {
      console.error('Error in Cheerio extraction:', error);
      throw error;
    }
  }
  
  /**
   * Implement rate limiting to avoid overloading target websites
   */
  private async rateLimit(): Promise<void> {
    this.requestCount++;
    const now = Date.now();
    const timeElapsed = now - this.lastRequestTime;
    
    // If we've made too many requests in the time window, delay the next one
    if (this.requestCount > this.MAX_REQUESTS_PER_MINUTE && timeElapsed < 60000) {
      const delayMs = 60000 - timeElapsed;
      console.log(`Rate limiting: delaying request by ${delayMs}ms`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      this.requestCount = 1;
      this.lastRequestTime = Date.now();
    } else if (timeElapsed >= 60000) {
      // Reset counters if more than a minute has passed
      this.requestCount = 1;
      this.lastRequestTime = now;
    }
  }
  
  /**
   * Resolve a URL relative to a base URL
   */
  private resolveUrl(base: string, url: string): string {
    // If it's already an absolute URL or a data URL, return it
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    
    try {
      // Otherwise, resolve it relative to the base URL
      return new URL(url, base).href;
    } catch (error) {
      console.error('Error resolving URL:', error);
      return url;
    }
  }
  
  /**
   * Get a filename from a URL
   */
  private getFilenameFromUrl(url: string): string {
    try {
      if (url.startsWith('data:')) {
        return 'data-image';
      }
      
      const urlObj = new URL(url);
      let pathname = urlObj.pathname;
      
      // Remove query parameters and hash
      pathname = pathname.split('?')[0].split('#')[0];
      
      // Get the last part of the path
      const filename = pathname.split('/').pop();
      
      if (!filename || filename.trim() === '') {
        return 'image';
      }
      
      return filename;
    } catch (error) {
      console.error('Error getting filename from URL:', error);
      return 'image';
    }
  }
  
  /**
   * Remove duplicate images based on URL
   */
  private removeDuplicates(images: Image[]): Image[] {
    const seen = new Set<string>();
    return images.filter(image => {
      if (seen.has(image.url)) {
        return false;
      }
      seen.add(image.url);
      return true;
    });
  }
  
  /**
   * Fetch metadata for an array of images
   */
  private async fetchImageMetadata(images: Image[]): Promise<Image[]> {
    const result: Image[] = [];
    const concurrentRequests = 5; // Limit concurrent requests
    
    // Process images in batches to avoid overwhelming the server
    for (let i = 0; i < images.length; i += concurrentRequests) {
      const batch = images.slice(i, i + concurrentRequests);
      const promises = batch.map(image => this.fetchSingleImageMetadata(image));
      
      // Wait for all promises in the batch to resolve
      const batchResults = await Promise.all(promises);
      result.push(...batchResults);
      
      // Small delay between batches to be nice to servers
      if (i + concurrentRequests < images.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    return result;
  }
  
  /**
   * Fetch metadata for a single image with fallback and better error handling
   */
  private async fetchSingleImageMetadata(image: Image): Promise<Image> {
    try {
      if (image.url.startsWith('data:')) {
        // Skip metadata fetching for data URLs
        return image;
      }
      
      try {
        // First try a HEAD request (faster)
        // Create AbortController for timeout implementation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(image.url, { 
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/*',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          return image;
        }
        
        // Get the content type and content length
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        
        return {
          ...image,
          size: contentLength ? parseInt(contentLength, 10) : undefined,
          type: contentType ? contentType.split('/')[1]?.toUpperCase() : image.type
        };
      } catch (headError) {
        // If HEAD request fails, attempt a GET request with ArrayBuffer to get the actual size
        console.log(`HEAD request failed for ${image.url}, attempting GET`);
        
        // Create AbortController for timeout implementation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(image.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/*'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          return image;
        }
        
        const contentType = response.headers.get('content-type');
        const buffer = await response.arrayBuffer();
        
        return {
          ...image,
          size: buffer.byteLength,
          type: contentType ? contentType.split('/')[1]?.toUpperCase() : image.type
        };
      }
    } catch (error) {
      console.error(`Error fetching metadata for image ${image.url}:`, error);
      return image;
    }
  }
}

export const imageExtractor = new ImageExtractor();
