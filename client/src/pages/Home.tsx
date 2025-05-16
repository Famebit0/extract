import Navbar from "@/components/Navbar";
import URLForm from "@/components/URLForm";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import ImageResults from "@/components/ImageResults";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import { useState } from "react";
import { Image } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [url, setUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractMutation = useMutation({
    mutationFn: async (url: string) => {
      try {
        const res = await apiRequest("POST", "/api/extract", { url });
        const data = await res.json();
        
        // Check if we got empty results
        if (data.images && data.images.length === 0) {
          throw new Error("No images found on this website. Try a different URL with more visual content.");
        }
        
        return data;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Failed to extract images. Please try a different website.");
      }
    },
    onError: (error: Error) => {
      console.error("Extraction error:", error);
      setError(error.message);
    },
    onSuccess: (data) => {
      console.log(`Successfully extracted ${data.images.length} images from ${data.url}`);
    }
  });

  const handleExtract = async (url: string) => {
    // Basic URL validation
    if (!url.trim()) {
      setError("Please enter a valid URL");
      return;
    }
    
    // Add http:// prefix if missing
    let processedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      processedUrl = 'https://' + url;
    }
    
    setUrl(processedUrl);
    setError(null);
    
    try {
      await extractMutation.mutateAsync(processedUrl);
    } catch (e) {
      // Error is already handled in the mutation
    }
  };

  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };
  
  const handleImageSelect = (image: Image, selected: boolean) => {
    // Update the images array with the selected state
    if (images) {
      const updatedImages = images.map(img => 
        img.url === image.url ? { ...img, selected } : img
      );
      
      // We need to update the mutation data to keep selection state when navigating
      extractMutation.data = {
        ...extractMutation.data,
        images: updatedImages
      };
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const images = extractMutation.data?.images as Image[] | undefined;
  const extractedUrl = extractMutation.data?.url as string | undefined;
  
  return (
    <div className="bg-gray-950 text-gray-100 min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero section with URL form - modern, clean design */}
      <div className="bg-gray-950 py-16 md:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 text-transparent bg-clip-text">
              Extract images
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            from any public website
          </p>
          
          <div className="mb-6 inline-flex rounded-md p-1 bg-gray-900/50 border border-gray-800">
            <button className="px-4 py-2 rounded-md bg-gray-800 text-white text-sm font-medium">
              Single Site
            </button>
            <button className="px-4 py-2 rounded-md text-gray-400 text-sm font-medium">
              Multiple Sites
            </button>
          </div>
          
          <URLForm onSubmit={handleExtract} />
          
          <div className="mt-8 max-w-md mx-auto bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-center space-x-4">
            <div className="bg-emerald-500/10 rounded-lg p-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8"/><path d="M3 16.2V21m0-4.8L9 21"/><path d="M3 7.8V3m0 4.8L9 3"/><path d="M21 7.8V3m0 4.8L15 3"/></svg>
            </div>
            <div className="text-left">
              <h3 className="text-white font-medium">Find Every Image</h3>
              <p className="text-gray-400 text-sm">We extract all image types, including backgrounds, lazy-loaded and SVG elements.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {extractMutation.isPending && <LoadingState />}

      {/* Error State */}
      {error && <ErrorState message={error} onTryAgain={() => setError(null)} />}

      {/* Results Section */}
      {extractMutation.isSuccess && images && (
        <ImageResults 
          images={images} 
          url={extractedUrl || url} 
          onImageClick={handleImageClick}
          onSelect={handleImageSelect}
        />
      )}

      {/* Features Section */}
      <Features />

      {/* How It Works Section */}
      <HowItWorks />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />

      {/* Image Preview Modal */}
      {selectedImage && images && (
        <ImagePreviewModal 
          image={selectedImage} 
          isOpen={isModalOpen} 
          onClose={closeModal}
          allImages={images}
          onNavigate={handleImageClick} 
        />
      )}
    </div>
  );
}
