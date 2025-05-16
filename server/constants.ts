import { ImageFormat } from "@shared/schema";

/**
 * Map of common content types to file extensions
 * Used for determining image format from MIME type
 */
export const MIME_TO_FORMAT_MAP: Record<string, ImageFormat> = {
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

/**
 * Reverse map for extension to MIME type
 * Used for determining MIME type from file extension
 */
export const FORMAT_TO_MIME_MAP: Record<string, string> = {
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "gif": "image/gif",
  "webp": "image/webp",
  "svg": "image/svg+xml",
  "avif": "image/avif",
  "bmp": "image/bmp",
  "ico": "image/x-icon",
  "tiff": "image/tiff",
  "heic": "image/heic",
  "heif": "image/heif"
};

/**
 * Common browser extensions for image formats
 */
export const FORMAT_EXTENSIONS = {
  "jpeg": [".jpeg", ".jpg"],
  "jpg": [".jpg", ".jpeg"],
  "png": [".png"],
  "gif": [".gif"],
  "webp": [".webp"],
  "svg": [".svg"],
  "avif": [".avif"],
  "bmp": [".bmp"],
  "ico": [".ico"],
  "tiff": [".tiff", ".tif"],
  "heic": [".heic"],
  "heif": [".heif"]
};

/**
 * Common browser support for image formats
 */
export const FORMAT_BROWSER_SUPPORT = {
  "jpeg": ["All browsers"],
  "jpg": ["All browsers"],
  "png": ["All browsers"],
  "gif": ["All browsers"],
  "webp": ["Chrome", "Firefox", "Edge", "Safari 14+", "Opera"],
  "svg": ["All browsers (as image)"],
  "avif": ["Chrome 85+", "Firefox 93+", "Opera 71+"],
  "bmp": ["All browsers"],
  "ico": ["All browsers"],
  "tiff": ["Safari"],
  "heic": ["Safari 13+ (MacOS only)"],
  "heif": ["Safari 13+ (MacOS only)"]
};

/**
 * User agent strings for various browsers
 */
export const USER_AGENTS = {
  chrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  firefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59",
  safari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
  bot: "Mozilla/5.0 (compatible; ImageExtractionBot/1.0; +http://example.com/bot)"
};