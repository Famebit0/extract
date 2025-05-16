import { Button } from "@/components/ui/button";
import { 
  Download, Filter, SortDesc, CheckSquare, 
  Square, ImageIcon, ArrowDownToLine, 
  Copy, ArrowUpDown, Info 
} from "lucide-react";
import { Image } from "@shared/schema";
import ImageCard from "./ImageCard";
import { useState, useEffect, useMemo } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import JSZip from 'jszip';

interface ImageResultsProps {
  images: Image[];
  url: string;
  onImageClick: (image: Image) => void;
  onSelect: (image: Image, selected: boolean) => void;
}

// Type for filtering options
type FilterOptions = {
  minWidth: number;
  minHeight: number;
  formatTypes: string[];
  minSize: number;
  maxSize: number;
  showSelected: boolean;
}

// Type for sorting options
type SortOption = 'size' | 'dimensions' | 'name' | 'type' | 'none';
type SortDirection = 'asc' | 'desc';

export default function ImageResults({ images: initialImages, url, onImageClick }: ImageResultsProps) {
  const { toast } = useToast();
  const [images, setImages] = useState<Image[]>(initialImages);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isClientSideDownload, setIsClientSideDownload] = useState(false);
  
  // Selection states
  const [selectedCount, setSelectedCount] = useState(initialImages.length);
  
  // Filter states
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    minWidth: 0,
    minHeight: 0,
    formatTypes: [],
    minSize: 0,
    maxSize: 100 * 1024 * 1024, // 100MB default max
    showSelected: false
  });
  
  // Sort states
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Available image types for filtering
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    initialImages.forEach(img => {
      if (img.type) types.add(img.type);
    });
    return Array.from(types);
  }, [initialImages]);
  
  // Handle image selection
  const handleSelectImage = (image: Image, selected: boolean) => {
    const updatedImages = images.map(img => 
      img.url === image.url ? { ...img, selected } : img
    );
    setImages(updatedImages);
  };
  
  // Select all / deselect all
  const handleSelectAll = () => {
    const allSelected = images.every(img => img.selected);
    const updatedImages = images.map(img => ({ ...img, selected: !allSelected }));
    setImages(updatedImages);
  };
  
  // Update selected count whenever images change
  useEffect(() => {
    const count = images.filter(img => img.selected).length;
    setSelectedCount(count);
  }, [images]);
  
  // Apply all filters
  const applyFilters = () => {
    let filteredImages = [...initialImages];
    
    // Apply dimension filters
    if (filterOptions.minWidth > 0) {
      filteredImages = filteredImages.filter(img => 
        img.width ? img.width >= filterOptions.minWidth : true
      );
    }
    
    if (filterOptions.minHeight > 0) {
      filteredImages = filteredImages.filter(img => 
        img.height ? img.height >= filterOptions.minHeight : true
      );
    }
    
    // Apply type filters
    if (filterOptions.formatTypes.length > 0) {
      filteredImages = filteredImages.filter(img => 
        img.type ? filterOptions.formatTypes.includes(img.type) : true
      );
    }
    
    // Apply size filters
    if (filterOptions.minSize > 0) {
      filteredImages = filteredImages.filter(img => 
        img.size ? img.size >= filterOptions.minSize : true
      );
    }
    
    if (filterOptions.maxSize < 100 * 1024 * 1024) {
      filteredImages = filteredImages.filter(img => 
        img.size ? img.size <= filterOptions.maxSize : true
      );
    }
    
    // Apply selected filter
    if (filterOptions.showSelected) {
      filteredImages = filteredImages.filter(img => img.selected);
    }
    
    // Apply sorting
    if (sortBy !== 'none') {
      filteredImages = sortImages(filteredImages, sortBy, sortDirection);
    }
    
    setImages(filteredImages);
    setShowFilterPopover(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilterOptions({
      minWidth: 0,
      minHeight: 0,
      formatTypes: [],
      minSize: 0,
      maxSize: 100 * 1024 * 1024,
      showSelected: false
    });
    setImages(initialImages);
    setSortBy('none');
    setSortDirection('desc');
    setShowFilterPopover(false);
  };
  
  // Sort images
  const sortImages = (imagesToSort: Image[], sort: SortOption, direction: SortDirection) => {
    const directionMultiplier = direction === 'asc' ? 1 : -1;
    
    return [...imagesToSort].sort((a, b) => {
      switch (sort) {
        case 'size':
          const sizeA = a.size || 0;
          const sizeB = b.size || 0;
          return (sizeA - sizeB) * directionMultiplier;
          
        case 'dimensions':
          const areaA = (a.width || 0) * (a.height || 0);
          const areaB = (b.width || 0) * (b.height || 0);
          return (areaA - areaB) * directionMultiplier;
          
        case 'name':
          return a.filename.localeCompare(b.filename) * directionMultiplier;
          
        case 'type':
          const typeA = a.type || '';
          const typeB = b.type || '';
          return typeA.localeCompare(typeB) * directionMultiplier;
          
        default:
          return 0;
      }
    });
  };
  
  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    if (sortBy !== 'none') {
      setImages(sortImages(images, sortBy, sortDirection === 'asc' ? 'desc' : 'asc'));
    }
  };
  
  // Server-side download all selected images
  const downloadSelectedImagesServer = async () => {
    try {
      setIsDownloading(true);
      toast({
        title: "Preparing download",
        description: "Creating ZIP file of selected images...",
      });
      
      const selectedImages = images.filter(img => img.selected);
      
      if (selectedImages.length === 0) {
        toast({
          title: "No images selected",
          description: "Please select at least one image to download.",
          variant: "destructive",
        });
        setIsDownloading(false);
        return;
      }
      
      const response = await apiRequest(
        "POST", 
        "/api/download-all", 
        { images: selectedImages.map(img => img.url) }
      );
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create object URL from blob
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary link
      const a = document.createElement("a");
      a.href = url;
      a.download = "extracted-images.zip";
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download ready",
        description: "Your images have been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error creating your download.",
        variant: "destructive",
      });
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };
  
  // Client-side download using JSZip
  const downloadSelectedImagesClient = async () => {
    try {
      setIsDownloading(true);
      setIsClientSideDownload(true);
      
      const selectedImages = images.filter(img => img.selected);
      
      if (selectedImages.length === 0) {
        toast({
          title: "No images selected",
          description: "Please select at least one image to download.",
          variant: "destructive",
        });
        setIsDownloading(false);
        setIsClientSideDownload(false);
        return;
      }
      
      toast({
        title: "Preparing download",
        description: `Creating ZIP file of ${selectedImages.length} selected images...`,
      });
      
      // Create a new JSZip instance
      const zip = new JSZip();
      
      // Process each image
      let processedCount = 0;
      
      for (const image of selectedImages) {
        try {
          // Fetch the image
          const response = await fetch(image.url);
          
          if (!response.ok) {
            console.error(`Failed to fetch image: ${image.url}`);
            continue;
          }
          
          // Get the blob
          const blob = await response.blob();
          
          // Add to zip (use filename or generate one)
          const filename = image.filename || `image-${processedCount + 1}.${image.type?.toLowerCase() || 'jpg'}`;
          zip.file(filename, blob);
          
          // Update progress
          processedCount++;
          setDownloadProgress(Math.round((processedCount / selectedImages.length) * 100));
        } catch (error) {
          console.error(`Error processing image ${image.url}:`, error);
        }
      }
      
      // Generate the zip file
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      }, (metadata) => {
        setDownloadProgress(Math.round(metadata.percent));
      });
      
      // Create download link
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'extracted-images.zip';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download complete",
        description: `Successfully downloaded ${processedCount} images.`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error creating your download.",
        variant: "destructive",
      });
      console.error("Client-side download error:", error);
    } finally {
      setIsDownloading(false);
      setIsClientSideDownload(false);
      setDownloadProgress(0);
    }
  };
  
  // Copy all selected image URLs to clipboard
  const copySelectedUrls = () => {
    const selectedImages = images.filter(img => img.selected);
    
    if (selectedImages.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image to copy.",
        variant: "destructive",
      });
      return;
    }
    
    const urls = selectedImages.map(img => img.url).join('\n');
    
    navigator.clipboard.writeText(urls)
      .then(() => {
        toast({
          title: "URLs copied",
          description: `Copied ${selectedImages.length} image URLs to clipboard.`,
        });
      })
      .catch((error) => {
        toast({
          title: "Copy failed",
          description: "Failed to copy URLs to clipboard.",
          variant: "destructive",
        });
        console.error("Copy error:", error);
      });
  };
  
  // Extract hostname for display
  const displayUrl = (() => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url;
    }
  })();
  
  // Remember extraction in localStorage
  useEffect(() => {
    try {
      // Get existing history
      const historyString = localStorage.getItem('imageExtractorHistory');
      const history = historyString ? JSON.parse(historyString) : [];
      
      // Add current URL if not already in history
      if (!history.some((item: {url: string}) => item.url === url)) {
        history.unshift({ 
          url, 
          date: new Date().toISOString(),
          imageCount: initialImages.length
        });
        
        // Keep only the last 10 entries
        const trimmedHistory = history.slice(0, 10);
        
        // Save back to localStorage
        localStorage.setItem('imageExtractorHistory', JSON.stringify(trimmedHistory));
      }
    } catch (error) {
      console.error("Error saving to history:", error);
    }
  }, [url, initialImages.length]);
  
  return (
    <div id="results-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-2 text-white flex items-center">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center mr-2">
              <ImageIcon className="h-4 w-4 text-emerald-500" />
            </div>
            Extracted Images
          </h2>
          <p className="text-gray-400">
            Found <span className="text-emerald-400 font-medium">{initialImages.length}</span> images on <span className="text-gray-300">{displayUrl}</span>
            {selectedCount !== initialImages.length && selectedCount > 0 && (
              <span className="ml-2 text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
                {selectedCount} selected
              </span>
            )}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          {/* Filter button with popover */}
          <Popover open={showFilterPopover} onOpenChange={setShowFilterPopover}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span>Filter</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Filter Images</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="min-width">Minimum Width (px)</Label>
                  <Input 
                    id="min-width" 
                    type="number" 
                    placeholder="0" 
                    min="0"
                    value={filterOptions.minWidth || ''}
                    onChange={e => setFilterOptions({
                      ...filterOptions, 
                      minWidth: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="min-height">Minimum Height (px)</Label>
                  <Input 
                    id="min-height" 
                    type="number" 
                    placeholder="0" 
                    min="0"
                    value={filterOptions.minHeight || ''}
                    onChange={e => setFilterOptions({
                      ...filterOptions, 
                      minHeight: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Image Format</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTypes.map(type => (
                      <div className="flex items-center space-x-2" key={type}>
                        <Checkbox 
                          id={`format-${type}`}
                          checked={filterOptions.formatTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilterOptions({
                                ...filterOptions,
                                formatTypes: [...filterOptions.formatTypes, type]
                              });
                            } else {
                              setFilterOptions({
                                ...filterOptions,
                                formatTypes: filterOptions.formatTypes.filter(t => t !== type)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`format-${type}`} className="text-sm">{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Checkbox 
                      checked={filterOptions.showSelected}
                      onCheckedChange={(checked) => {
                        setFilterOptions({
                          ...filterOptions,
                          showSelected: !!checked
                        });
                      }}
                    />
                    <span>Show only selected images</span>
                  </Label>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Reset
                  </Button>
                  <Button size="sm" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Sort button with popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <SortDesc className="mr-2 h-4 w-4" />
                <span>Sort</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="space-y-4">
                <h4 className="font-medium">Sort Images By</h4>
                
                <div className="space-y-2">
                  <Select 
                    value={sortBy} 
                    onValueChange={(value) => {
                      setSortBy(value as SortOption);
                      setImages(sortImages(images, value as SortOption, sortDirection));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sort criteria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Original order)</SelectItem>
                      <SelectItem value="size">File Size</SelectItem>
                      <SelectItem value="dimensions">Dimensions</SelectItem>
                      <SelectItem value="name">Filename</SelectItem>
                      <SelectItem value="type">Format Type</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center"
                    onClick={toggleSortDirection}
                    disabled={sortBy === 'none'}
                  >
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Select/Deselect All Button */}
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={handleSelectAll}
          >
            {images.every(img => img.selected) 
              ? <><Square className="mr-2 h-4 w-4" /> <span>Deselect All</span></>
              : <><CheckSquare className="mr-2 h-4 w-4" /> <span>Select All</span></>
            }
          </Button>
          
          {/* More Actions Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <ImageIcon className="mr-2 h-4 w-4" />
                <span>Actions</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="space-y-2">
                <h4 className="font-medium mb-2">Image Actions</h4>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={copySelectedUrls}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Copy Image URLs</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={downloadSelectedImagesClient}
                  disabled={isDownloading}
                >
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  <span>Client Download (ZIP)</span>
                </Button>
                
                <div className="mt-2 pt-2 border-t">
                  <div className="text-xs text-gray-500 flex items-start mt-2">
                    <Info className="h-3 w-3 mr-1 mt-0.5" />
                    <span>Client-side download processes images in your browser</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Download Button */}
          <Button 
            className="bg-primary text-white hover:bg-blue-600 transition flex items-center"
            onClick={downloadSelectedImagesServer}
            disabled={isDownloading}
          >
            <Download className="mr-2 h-4 w-4" />
            <span>{isDownloading ? "Preparing..." : "Download Selected"}</span>
          </Button>
        </div>
      </div>
      
      {/* Download Progress Bar */}
      {isDownloading && (
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-sm">
            <span>Downloading images...</span>
            <span>{downloadProgress}%</span>
          </div>
          <Progress value={downloadProgress} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">
            {isClientSideDownload 
              ? "Processing in browser. Please wait..." 
              : "Server is preparing your download..."}
          </p>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {images.map((image, index) => (
            <ImageCard 
              key={`${image.url}-${index}`} 
              image={image} 
              onClick={() => onImageClick(image)}
              onSelect={handleSelectImage}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No images match your current filters.</p>
          <Button 
            variant="link" 
            className="mt-2" 
            onClick={resetFilters}
          >
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
}
