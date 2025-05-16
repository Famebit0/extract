import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Image } from "@shared/schema";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImagePreviewDetails from "./ImagePreviewDetails";
import { useImageCache } from "@/hooks/use-image-cache";

interface ImagePreviewModalProps {
  image: Image;
  isOpen: boolean;
  onClose: () => void;
  allImages?: Image[];  // Optional array of all images for navigation
  onNavigate?: (image: Image) => void;  // Optional callback for image navigation
}

export default function ImagePreviewModal({ 
  image, 
  isOpen, 
  onClose, 
  allImages,
  onNavigate
}: ImagePreviewModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("preview");
  const cachedImageUrl = useImageCache(image.url);

  const downloadImage = async () => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = image.filename || "image";
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download successful",
        description: `${image.filename || "Image"} has been downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download this image.",
        variant: "destructive",
      });
    }
  };

  // Navigate to previous/next image if available
  const navigatePrev = () => {
    if (!allImages || !onNavigate) return;
    
    const currentIndex = allImages.findIndex(img => img.url === image.url);
    if (currentIndex > 0) {
      onNavigate(allImages[currentIndex - 1]);
    }
  };
  
  const navigateNext = () => {
    if (!allImages || !onNavigate) return;
    
    const currentIndex = allImages.findIndex(img => img.url === image.url);
    if (currentIndex < allImages.length - 1) {
      onNavigate(allImages[currentIndex + 1]);
    }
  };
  
  // Determine if navigation is possible
  const canNavigatePrev = allImages && allImages.findIndex(img => img.url === image.url) > 0;
  const canNavigateNext = allImages && allImages.findIndex(img => img.url === image.url) < allImages.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex justify-between items-center">
          <div>
            <DialogTitle className="text-lg">{image.filename || "Image Preview"}</DialogTitle>
            {image.type && (
              <DialogDescription className="text-xs">
                {image.type.toUpperCase()} Image
              </DialogDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {allImages && allImages.length > 1 && (
              <div className="flex items-center mr-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  disabled={!canNavigatePrev}
                  onClick={navigatePrev}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="mx-2 text-xs text-muted-foreground">
                  {allImages.findIndex(img => img.url === image.url) + 1} / {allImages.length}
                </span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  disabled={!canNavigateNext}
                  onClick={navigateNext}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col overflow-hidden">
          <TabsList className="mx-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          
          <div className="p-4 overflow-auto flex-grow">
            <TabsContent value="preview" className="mt-0 h-full flex items-center justify-center">
              <div className="relative max-w-full max-h-[60vh] flex items-center justify-center">
                <img 
                  src={cachedImageUrl} 
                  alt={image.alt || "Preview of selected image"}
                  className="max-w-full max-h-[60vh] object-contain"
                  loading="lazy"
                />
                {image.width && image.height && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs py-1 px-2 rounded">
                    {image.width} × {image.height}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="mt-0">
              <ImagePreviewDetails image={image} onDownload={downloadImage} />
            </TabsContent>
          </div>
        </Tabs>
        
        <div className="border-t p-4 flex justify-end gap-3">
          <Button 
            className="bg-primary text-white hover:bg-blue-600" 
            onClick={downloadImage}
          >
            Download Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
