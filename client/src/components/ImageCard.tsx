import { Eye, Download, Check } from "lucide-react";
import { Image } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface ImageCardProps {
  image: Image;
  onClick: () => void;
  onSelect: (image: Image, selected: boolean) => void;
}

export default function ImageCard({ image, onClick, onSelect }: ImageCardProps) {
  const { toast } = useToast();

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown size";
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  };

  const downloadImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
      console.error("Error downloading image:", error);
    }
  };

  const handleSelectChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(image, !image.selected);
  };

  return (
    <div 
      className="relative group overflow-hidden rounded-lg border border-gray-800 bg-gray-900 cursor-pointer aspect-square"
      onClick={onClick}
    >
      <img 
        src={image.url} 
        alt={image.alt || "Extracted image"} 
        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex gap-2">
          <button 
            className="bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 border border-gray-700 transition"
            onClick={onClick}
            aria-label="View image"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button 
            className="bg-emerald-500 text-white p-2 rounded-full hover:bg-emerald-600 transition"
            onClick={downloadImage}
            aria-label="Download image"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="absolute top-2 left-2 z-10">
        <div 
          className={`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
            image.selected 
              ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
          }`}
          onClick={handleSelectChange}
        >
          {image.selected && <Check className="h-4 w-4" />}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm text-gray-300 text-xs py-1.5 px-2 border-t border-gray-800/80">
        <div className="truncate text-white">{image.filename || "image"}</div>
        <div className="flex justify-between">
          <span className="text-gray-400">
            {image.width && image.height 
              ? `${image.width} × ${image.height}` 
              : "Unknown dimensions"
            }
          </span>
          <span className="text-emerald-400 font-mono">
            {formatFileSize(image.size)}
          </span>
        </div>
      </div>
    </div>
  );
}
