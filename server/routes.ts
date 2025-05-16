import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { extractRequestSchema } from "@shared/schema";
import { imageExtractor } from "./imageExtractor";
import { proxyImage, getImageInfo } from "./imageProxy";
import archiver from "archiver";
import fetch from "node-fetch";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { URL } from "url";

export async function registerRoutes(app: Express): Promise<Server> {
  // Extract images from URL
  app.post("/api/extract", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const { url } = extractRequestSchema.parse(req.body);
      
      // Validate URL format
      try {
        new URL(url);
      } catch (e) {
        return res.status(400).json({ 
          message: "Invalid URL format. Please provide a valid URL." 
        });
      }
      
      try {
        // Extract images from the URL
        const images = await imageExtractor.extractImagesFromUrl(url);
        
        // Check if we got any images
        if (images.length === 0) {
          return res.status(200).json({
            url,
            images,
            message: "No images found on this URL. The website might not have any images or might restrict access."
          });
        }
        
        // Add the URL to the server's history storage (if needed)
        // This could be implemented later to store previous searches
        
        // Return the images
        return res.status(200).json({
          url,
          images
        });
      } catch (extractError) {
        // Handle common extraction errors
        const errorMessage = extractError instanceof Error ? extractError.message : "Unknown error";
        
        if (errorMessage.includes("Forbidden") || errorMessage.includes("403")) {
          return res.status(403).json({ 
            message: "This website has blocked our access. It's likely using protections against image extraction."
          });
        }
        
        if (errorMessage.includes("Not Found") || errorMessage.includes("404")) {
          return res.status(404).json({ 
            message: "Website not found. Please check the URL and try again."
          });
        }
        
        if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("getaddrinfo")) {
          return res.status(404).json({ 
            message: "Domain not found. Please check the URL and try again."
          });
        }
        
        // For timeout and other connection issues
        if (
          errorMessage.includes("timeout") || 
          errorMessage.includes("ETIMEDOUT") || 
          errorMessage.includes("ECONNREFUSED")
        ) {
          return res.status(504).json({ 
            message: "Connection to website timed out. The site might be down or too slow to respond."
          });
        }
        
        // For all other extraction errors
        console.error("Error extracting images:", extractError);
        return res.status(500).json({ message: errorMessage });
      }
    } catch (error) {
      console.error("Error processing extract request:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process request" 
      });
    }
  });

  // Download all images as zip
  app.post("/api/download-all", async (req: Request, res: Response) => {
    try {
      const { images } = req.body;
      
      if (!Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ message: "No images provided" });
      }
      
      // Set up response headers for zip file
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=extracted-images.zip');
      
      // Create a zip archive
      const archive = archiver('zip', {
        zlib: { level: 5 } // Compression level
      });
      
      // Pipe the archive to the response
      archive.pipe(res);
      
      // Process each image URL
      for (let i = 0; i < images.length; i++) {
        try {
          const imageUrl = images[i];
          
          // Get filename from URL
          const filename = imageUrl.split('/').pop() || `image-${i + 1}`;
          
          // Fetch the image
          const imageResponse = await fetch(imageUrl);
          
          if (!imageResponse.ok) {
            console.error(`Failed to download image ${imageUrl}: ${imageResponse.statusText}`);
            continue;
          }
          
          // Get the image buffer
          const buffer = await imageResponse.buffer();
          
          // Add the image to the archive
          archive.append(buffer, { name: filename });
        } catch (err) {
          console.error(`Error processing image at index ${i}:`, err);
          // Continue with other images
        }
      }
      
      // Finalize the archive
      await archive.finalize();
    } catch (error) {
      console.error("Error creating zip archive:", error);
      
      // If headers haven't been sent yet, send an error response
      if (!res.headersSent) {
        res.status(500).json({ 
          message: error instanceof Error ? error.message : "Failed to create zip archive" 
        });
      }
    }
  });
  
  // Image proxy endpoint
  app.get("/api/proxy", proxyImage);
  
  // Image info endpoint
  app.get("/api/image-info", getImageInfo);
  
  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        extractor: "up",
        proxy: "up"
      }
    });
  });
  
  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandled error:", err);
    
    if (!res.headersSent) {
      let status = 500;
      let message = "Internal server error";
      
      // Handle specific error types
      if (err instanceof ZodError) {
        status = 400;
        message = fromZodError(err).message;
      } else if (err.name === "NetworkError") {
        status = 502;
        message = "Network error while accessing external resource";
      } else if (err.name === "TimeoutError" || err.message.includes("timeout")) {
        status = 504;
        message = "Request timed out";
      }
      
      res.status(status).json({
        error: message,
        details: process.env.NODE_ENV === "development" ? err.message : undefined
      });
    }
    
    next();
  });

  const httpServer = createServer(app);
  return httpServer;
}
