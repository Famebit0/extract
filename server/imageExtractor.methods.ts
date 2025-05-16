import { Image, imageSchema, ImageFormat } from "@shared/schema";
import * as cheerio from "cheerio";
import { URL } from "url";
import path from "path";
import { MIME_TO_FORMAT_MAP, FORMAT_TO_MIME_MAP } from "./constants";

/**
 * Comprehensive image extraction methods
 * These methods are designed to be used by the ImageExtractor class
 */

/**
 * Process an <img> element to extract image information
 */
export function processImgElement(
  img: cheerio.Cheerio, 
  $: cheerio.CheerioAPI, 
  pageUrl: string, 
  baseUrl: string, 
  allImages: Image[], 
  addImageFromUrl: Function
): void {
  try {
    // Main sources for image data
    const src = img.attr('src');
    const dataSrc = img.attr('data-src');
    const dataSrcset = img.attr('data-srcset');
    const lazySrc = img.attr('data-lazy-src');
    const srcset = img.attr('srcset');
    const alt = img.attr('alt') || '';
    const width = parseInt(img.attr('width') || '0', 10) || undefined;
    const height = parseInt(img.attr('height') || '0', 10) || undefined;
    const isLazyLoaded = !!(dataSrc || lazySrc || img.attr('loading') === 'lazy');
    
    // Check all possible image sources
    const sources = [src, dataSrc, lazySrc].filter(Boolean) as string[];
    const originalElement = $.html(img);
    
    for (const imgSrc of sources) {
      addImageFromUrl(imgSrc, {
        pageUrl,
        baseUrl,
        alt,
        width,
        height,
        sourceType: 'img',
        isLazyLoaded,
        originalElement,
        dataSrc: dataSrc || lazySrc,
        isResponsive: !!srcset || !!dataSrcset
      }, allImages);
    }
    
    // Process srcset attribute
    if (srcset) {
      processSrcsetAttribute(srcset, {
        pageUrl,
        baseUrl,
        alt,
        width,
        height,
        sourceType: 'img',
        isLazyLoaded,
        originalElement,
        addImageFromUrl
      }, allImages);
    }
    
    // Process data-srcset for lazy loading
    if (dataSrcset) {
      processSrcsetAttribute(dataSrcset, {
        pageUrl,
        baseUrl,
        alt,
        width,
        height,
        sourceType: 'img',
        isLazyLoaded: true,
        originalElement,
        dataSrc: dataSrcset,
        addImageFromUrl
      }, allImages);
    }
  } catch (error) {
    console.warn('Error processing img element:', error);
  }
}

/**
 * Process a <picture> element to extract all source images
 */
export function processPictureElement(
  picture: cheerio.Cheerio, 
  $: cheerio.CheerioAPI, 
  pageUrl: string, 
  baseUrl: string, 
  allImages: Image[], 
  addImageFromUrl: Function
): void {
  try {
    // First, get the fallback img if present
    const img = picture.find('img');
    if (img.length) {
      processImgElement(img, $, pageUrl, baseUrl, allImages, addImageFromUrl);
    }
    
    // Then process all source elements
    picture.find('source').each((_, sourceElement) => {
      const source = $(sourceElement);
      processSourceElement(source, pageUrl, baseUrl, allImages, addImageFromUrl);
    });
  } catch (error) {
    console.warn('Error processing picture element:', error);
  }
}

/**
 * Process a <source> element to extract srcset images
 */
export function processSourceElement(
  source: cheerio.Cheerio, 
  pageUrl: string, 
  baseUrl: string, 
  allImages: Image[], 
  addImageFromUrl: Function
): void {
  try {
    const srcset = source.attr('srcset');
    const type = source.attr('type') || undefined;
    const media = source.attr('media') || undefined;
    
    if (srcset) {
      processSrcsetAttribute(srcset, {
        pageUrl,
        baseUrl,
        sourceType: 'picture',
        mimeType: type,
        isResponsive: !!media,
        addImageFromUrl
      }, allImages);
    }
  } catch (error) {
    console.warn('Error processing source element:', error);
  }
}

/**
 * Process srcset attribute to extract all image urls
 */
export function processSrcsetAttribute(
  srcset: string, 
  options: {
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
    isResponsive?: boolean,
    addImageFromUrl: Function
  }, 
  allImages: Image[]
): void {
  try {
    // Parse srcset format like "image.jpg 1x, image2.jpg 2x" or "image.jpg 800w, image2.jpg 1200w"
    const srcsetParts = srcset.split(',');
    
    for (const part of srcsetParts) {
      const [srcsetUrl] = part.trim().split(/\s+/);
      if (srcsetUrl) {
        const { addImageFromUrl, ...imageOptions } = options;
        addImageFromUrl(srcsetUrl, imageOptions, allImages);
      }
    }
  } catch (error) {
    console.warn(`Error processing srcset: ${srcset}`, error);
  }
}

/**
 * Process an SVG element
 */
export function processSvgElement(
  svg: cheerio.Cheerio, 
  $: cheerio.CheerioAPI, 
  pageUrl: string, 
  allImages: Image[]
): void {
  try {
    // For embedded SVGs, generate a unique identifier
    const svgContent = $.html(svg);
    if (svgContent) {
      const svgHash = Buffer.from(svgContent).toString('base64').substr(0, 8);
      const filename = `svg-${svgHash}.svg`;
      
      try {
        const viewBox = svg.attr('viewBox');
        let width, height;
        
        if (viewBox) {
          const dimensions = viewBox.split(' ');
          if (dimensions.length === 4) {
            width = parseInt(dimensions[2], 10);
            height = parseInt(dimensions[3], 10);
          }
        }
        
        // Use explicit width/height if available
        width = parseInt(svg.attr('width') || width?.toString() || '0', 10) || undefined;
        height = parseInt(svg.attr('height') || height?.toString() || '0', 10) || undefined;
        
        // Calculate aspect ratio if we have both width and height
        let aspectRatio: number | undefined;
        if (width && height && width > 0 && height > 0) {
          aspectRatio = width / height;
        }
        
        const image: Image = imageSchema.parse({
          url: `${pageUrl}#${filename}`, // Use URL fragment to create a unique identifier
          filename,
          width,
          height,
          type: 'image/svg+xml',
          format: 'svg',
          sourceType: 'svg',
          originalElement: svgContent.substring(0, 300), // Limit size
          aspectRatio
        });
        
        allImages.push(image);
      } catch (error) {
        console.warn(`Failed to parse SVG element:`, error);
      }
    }
  } catch (error) {
    console.warn(`Error processing SVG element:`, error);
  }
}

/**
 * Process inline background-image CSS property
 */
export function processInlineBackgroundImage(
  style: string, 
  pageUrl: string, 
  baseUrl: string, 
  allImages: Image[], 
  addImageFromUrl: Function
): void {
  try {
    // Match all url() occurrences in the style attribute
    const urlRegex = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
    let match;
    
    while ((match = urlRegex.exec(style)) !== null) {
      const [, backgroundUrl] = match;
      if (backgroundUrl && !backgroundUrl.startsWith('data:')) {
        addImageFromUrl(backgroundUrl, {
          pageUrl,
          baseUrl,
          sourceType: 'background'
        }, allImages);
      }
    }
  } catch (error) {
    console.warn(`Error processing background image:`, error);
  }
}

/**
 * Process a <link> element for icon images
 */
export function processLinkElement(
  link: cheerio.Cheerio, 
  pageUrl: string, 
  baseUrl: string, 
  allImages: Image[], 
  addImageFromUrl: Function
): void {
  try {
    const href = link.attr('href');
    const rel = link.attr('rel');
    const sizes = link.attr('sizes');
    const type = link.attr('type');
    
    if (href) {
      let width, height;
      
      // Parse sizes attribute if available (e.g., "32x32")
      if (sizes && sizes.includes('x')) {
        const [w, h] = sizes.split('x');
        width = parseInt(w, 10) || undefined;
        height = parseInt(h, 10) || undefined;
      }
      
      addImageFromUrl(href, {
        pageUrl,
        baseUrl,
        width,
        height,
        sourceType: 'link',
        mimeType: type
      }, allImages);
    }
  } catch (error) {
    console.warn(`Error processing link element:`, error);
  }
}

/**
 * Process a <meta> element with image content
 */
export function processMetaImageElement(
  meta: cheerio.Cheerio, 
  pageUrl: string, 
  baseUrl: string, 
  allImages: Image[], 
  addImageFromUrl: Function
): void {
  try {
    const content = meta.attr('content');
    if (content) {
      addImageFromUrl(content, {
        pageUrl,
        baseUrl,
        sourceType: 'meta'
      }, allImages);
    }
  } catch (error) {
    console.warn(`Error processing meta image:`, error);
  }
}

/**
 * Process <style> tag content to extract background images
 */
export function processStyleTagContent(
  styleContent: string, 
  pageUrl: string, 
  baseUrl: string, 
  allImages: Image[], 
  addImageFromUrl: Function
): void {
  try {
    // Simple regex to find background-image: url() patterns
    // Note: This is not a complete CSS parser
    const urlRegex = /background(-image)?\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
    let match;
    
    while ((match = urlRegex.exec(styleContent)) !== null) {
      const [, , cssUrl] = match;
      if (cssUrl && !cssUrl.startsWith('data:')) {
        addImageFromUrl(cssUrl, {
          pageUrl,
          baseUrl,
          sourceType: 'background'
        }, allImages);
      }
    }
  } catch (error) {
    console.warn(`Error processing style tag:`, error);
  }
}

/**
 * Process a <canvas> element
 */
export function processCanvasElement(
  canvas: cheerio.Cheerio, 
  pageUrl: string, 
  baseUrl: string, 
  allImages: Image[], 
  addImageFromUrl: Function
): void {
  try {
    // We can only extract from canvas if there's a data-src or src attribute
    const dataSrc = canvas.attr('data-src');
    const src = canvas.attr('src');
    const width = parseInt(canvas.attr('width') || '0', 10) || undefined;
    const height = parseInt(canvas.attr('height') || '0', 10) || undefined;
    
    if (dataSrc) {
      addImageFromUrl(dataSrc, {
        pageUrl,
        baseUrl,
        width,
        height,
        sourceType: 'canvas',
        isLazyLoaded: true,
        dataSrc
      }, allImages);
    }
    
    if (src) {
      addImageFromUrl(src, {
        pageUrl,
        baseUrl,
        width,
        height,
        sourceType: 'canvas'
      }, allImages);
    }
  } catch (error) {
    console.warn(`Error processing canvas element:`, error);
  }
}

/**
 * Process an <iframe> element for potential image content
 */
export function processIframeElement(
  iframe: cheerio.Cheerio, 
  pageUrl: string, 
  baseUrl: string, 
  allImages: Image[], 
  addImageFromUrl: Function
): void {
  try {
    // Check for iframe src that might be an image viewer or gallery
    const src = iframe.attr('src');
    if (src) {
      // Only process if it looks like an image-related iframe
      // (e.g., from image hosting sites or galleries)
      const lowerSrc = src.toLowerCase();
      if (
        lowerSrc.includes('image') || 
        lowerSrc.includes('photo') || 
        lowerSrc.includes('gallery') ||
        lowerSrc.includes('flickr') ||
        lowerSrc.includes('imgur') ||
        lowerSrc.includes('instagram')
      ) {
        addImageFromUrl(src, {
          pageUrl,
          baseUrl,
          sourceType: 'iframe'
        }, allImages);
      }
    }
  } catch (error) {
    console.warn(`Error processing iframe element:`, error);
  }
}

/**
 * Process JSON-LD script for image URLs
 */
export function processJsonLdScript(
  script: cheerio.Cheerio, 
  pageUrl: string, 
  baseUrl: string, 
  allImages: Image[], 
  addImageFromUrl: Function
): void {
  try {
    const content = script.html();
    if (content) {
      // Try to parse as JSON
      try {
        const json = JSON.parse(content);
        // Extract image URLs from common JSON-LD structures
        extractImagesFromJsonLd(json, pageUrl, baseUrl, allImages, addImageFromUrl);
      } catch (jsonError) {
        // Not valid JSON, ignore
      }
    }
  } catch (error) {
    console.warn(`Error processing JSON-LD script:`, error);
  }
}

/**
 * Extract images from JSON-LD data
 */
export function extractImagesFromJsonLd(
  json: any, 
  pageUrl: string, 
  baseUrl: string, 
  allImages: Image[], 
  addImageFromUrl: Function
): void {
  try {
    // Helper function to process nested objects
    const processObject = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      // Check for image properties
      const imageProps = ['image', 'thumbnail', 'logo', 'photo', 'primaryImageOfPage'];
      
      for (const prop of imageProps) {
        if (obj[prop]) {
          // Handle both string and object/array cases
          if (typeof obj[prop] === 'string') {
            addImageFromUrl(obj[prop], {
              pageUrl,
              baseUrl,
              sourceType: 'jsonld'
            }, allImages);
          } else if (Array.isArray(obj[prop])) {
            for (const item of obj[prop]) {
              if (typeof item === 'string') {
                addImageFromUrl(item, {
                  pageUrl,
                  baseUrl,
                  sourceType: 'jsonld'
                }, allImages);
              } else if (item && typeof item === 'object' && item.url) {
                addImageFromUrl(item.url, {
                  pageUrl,
                  baseUrl,
                  width: item.width,
                  height: item.height,
                  sourceType: 'jsonld'
                }, allImages);
              }
            }
          } else if (obj[prop].url) {
            addImageFromUrl(obj[prop].url, {
              pageUrl,
              baseUrl,
              width: obj[prop].width,
              height: obj[prop].height,
              sourceType: 'jsonld'
            }, allImages);
          }
        }
      }
      
      // Recursively process arrays
      if (Array.isArray(obj)) {
        for (const item of obj) {
          processObject(item);
        }
        return;
      }
      
      // Recursively process object properties
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === 'object') {
          processObject(obj[key]);
        }
      }
    };
    
    processObject(json);
  } catch (error) {
    console.warn(`Error extracting images from JSON-LD:`, error);
  }
}

/**
 * Process various data-* attributes that might contain image paths
 */
export function processDataAttributes(
  element: cheerio.Cheerio, 
  pageUrl: string, 
  baseUrl: string, 
  allImages: Image[], 
  addImageFromUrl: Function
): void {
  try {
    // Common data attributes that might contain image URLs
    const dataAttrs = [
      'data-src', 'data-original', 'data-lazy', 'data-bg', 'data-background',
      'data-srcset', 'data-original-set', 'data-lazy-srcset', 'data-sizes',
      'data-full-size-src', 'data-high-res-src', 'data-medium-src', 'data-low-src'
    ];
    
    for (const attr of dataAttrs) {
      const value = element.attr(attr);
      if (value && !value.startsWith('data:')) {
        // For srcset-like attributes
        if (attr.includes('srcset') || attr.includes('set')) {
          processSrcsetAttribute(value, {
            pageUrl,
            baseUrl,
            sourceType: 'other',
            isLazyLoaded: true,
            dataSrc: value,
            addImageFromUrl
          }, allImages);
        } else {
          addImageFromUrl(value, {
            pageUrl,
            baseUrl,
            sourceType: 'other',
            isLazyLoaded: true,
            dataSrc: value
          }, allImages);
        }
      }
    }
  } catch (error) {
    console.warn(`Error processing data attributes:`, error);
  }
}