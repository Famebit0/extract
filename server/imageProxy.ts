import { Request, Response } from 'express';
import fetch, { RequestInit } from 'node-fetch';
import { pipeline, Readable } from 'stream';
import { promisify } from 'util';
import { URL } from 'url';

// Promisify the stream pipeline
const streamPipeline = promisify(pipeline);

// Image format mappings (minimal subset needed for proxy)
const MIME_TO_FORMAT_MAP: Record<string, string> = {
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
  "image/tiff": "tiff",
  "image/heic": "heic",
  "image/heif": "heif"
};

// Extended RequestInit with timeout
interface ExtendedRequestInit extends RequestInit {
  timeout?: number;
}

// Maximum cache time in seconds (24 hours)
const MAX_CACHE_AGE = 86400;

// List of allowed domains for security (empty means all allowed)
// Configure this as needed to restrict access
const ALLOWED_DOMAINS: string[] = [];

/**
 * Proxy an image from a remote source
 * This handles proper streaming, caching, and error handling
 */
export async function proxyImage(req: Request, res: Response): Promise<void> {
  try {
    // Get and validate the URL
    const imageUrl = decodeURIComponent(req.query.url as string);
    
    if (!imageUrl) {
      res.status(400).json({ error: 'Missing URL parameter' });
      return;
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
      
      // Check if the protocol is http or https
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        res.status(400).json({ error: 'Invalid URL protocol, only HTTP and HTTPS are supported' });
        return;
      }
      
      // Check allowed domains if configured
      if (ALLOWED_DOMAINS.length > 0) {
        const domain = parsedUrl.hostname;
        if (!ALLOWED_DOMAINS.some(allowedDomain => domain === allowedDomain || domain.endsWith(`.${allowedDomain}`))) {
          res.status(403).json({ error: 'Domain not allowed for security reasons' });
          return;
        }
      }
    } catch (e) {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    // Fetch the image with appropriate headers
    const options: ExtendedRequestInit = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/avif,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': parsedUrl.origin
      },
      method: 'GET',
      redirect: 'follow',
      // @ts-ignore - node-fetch supports timeout but types don't reflect it
      timeout: 15000, // 15 second timeout
    };

    const response = await fetch(imageUrl, options);

    // Check if response is successful
    if (!response.ok) {
      const errorMessage = `Failed to fetch image: ${response.status} ${response.statusText}`;
      console.error(errorMessage);
      res.status(response.status).json({ error: errorMessage });
      return;
    }

    // Get content type and validate it's an image
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      res.status(400).json({ error: 'URL does not point to a valid image' });
      return;
    }

    // Set response headers
    res.setHeader('Content-Type', contentType);
    
    // Set cache headers
    res.setHeader('Cache-Control', `public, max-age=${MAX_CACHE_AGE}`);
    
    // Copy other relevant headers
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Stream the image data to the client if body exists
    if (response.body) {
      await streamPipeline(Readable.fromWeb(response.body as any), res);
    } else {
      res.status(500).json({ error: 'Failed to get image data stream' });
      return;
    }
  } catch (error) {
    console.error('Image proxy error:', error);
    
    // Don't send error response if headers are already sent
    if (!res.headersSent) {
      if (error instanceof Error && error.name === 'AbortError') {
        res.status(504).json({ error: 'Request timed out' });
      } else {
        res.status(500).json({ error: 'Failed to proxy image' });
      }
    }
  }
}

/**
 * Get information about an image without downloading the full image
 * This is useful for getting dimensions, file size, and format
 */
export async function getImageInfo(req: Request, res: Response): Promise<void> {
  try {
    // Get and validate the URL
    const imageUrl = decodeURIComponent(req.query.url as string);
    
    if (!imageUrl) {
      res.status(400).json({ error: 'Missing URL parameter' });
      return;
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch (e) {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    // Perform a HEAD request to get metadata
    const options: ExtendedRequestInit = {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      // @ts-ignore - node-fetch supports timeout but types don't reflect it
      timeout: 5000
    };
    
    const response = await fetch(imageUrl, options);

    if (!response.ok) {
      res.status(response.status).json({ 
        error: `Failed to fetch image info: ${response.status} ${response.statusText}` 
      });
      return;
    }

    // Get relevant headers
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    // Determine image format from content type
    let format = 'unknown';
    if (contentType && contentType in MIME_TO_FORMAT_MAP) {
      format = MIME_TO_FORMAT_MAP[contentType];
    }

    // Return image information
    res.json({
      url: imageUrl,
      mimeType: contentType,
      format,
      size: contentLength ? parseInt(contentLength, 10) : undefined,
      // Note: To get dimensions, we would need to download and parse the image
      // which would defeat the purpose of a lightweight HEAD request
    });
  } catch (error) {
    console.error('Image info error:', error);
    res.status(500).json({ error: 'Failed to get image information' });
  }
}