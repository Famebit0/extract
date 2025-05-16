import { Image } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Download, Copy, Check, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ImagePreviewDetailsProps {
  image: Image;
  onDownload: () => void;
}

export default function ImagePreviewDetails({ image, onDownload }: ImagePreviewDetailsProps) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
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
  
  const viewOriginal = () => {
    window.open(image.url, '_blank');
  };
  
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedField(field);
        toast({
          title: "Copied to clipboard",
          description: `${field} has been copied to clipboard.`,
        });
        
        // Reset the copied state after 2 seconds
        setTimeout(() => {
          setCopiedField(null);
        }, 2000);
      })
      .catch(() => {
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard.",
          variant: "destructive",
        });
      });
  };
  
  const copyHtml = () => {
    const html = `<img src="${image.url}" alt="${image.alt || ''}" ${image.width ? `width="${image.width}"` : ''} ${image.height ? `height="${image.height}"` : ''} />`;
    copyToClipboard(html, 'HTML');
  };
  
  const copyMarkdown = () => {
    const markdown = `![${image.alt || image.filename}](${image.url})`;
    copyToClipboard(markdown, 'Markdown');
  };
  
  const copyUrl = () => {
    copyToClipboard(image.url, 'URL');
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Filename</TableCell>
              <TableCell className="font-mono text-xs truncate max-w-[200px]">{image.filename}</TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => copyToClipboard(image.filename, 'Filename')}
                >
                  {copiedField === 'Filename' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">URL</TableCell>
              <TableCell className="font-mono text-xs truncate max-w-[200px]">{image.url}</TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={copyUrl}
                >
                  {copiedField === 'URL' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Dimensions</TableCell>
              <TableCell>
                {image.width && image.height 
                  ? `${image.width} × ${image.height} px` 
                  : "Unknown dimensions"
                }
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Size</TableCell>
              <TableCell>{formatFileSize(image.size)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Type</TableCell>
              <TableCell>{image.type || "Unknown"}</TableCell>
              <TableCell></TableCell>
            </TableRow>
            {image.alt && (
              <TableRow>
                <TableCell className="font-medium">Alt Text</TableCell>
                <TableCell className="truncate max-w-[200px]">{image.alt}</TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0" 
                    onClick={() => copyToClipboard(image.alt || '', 'Alt Text')}
                  >
                    {copiedField === 'Alt Text' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="rounded-md bg-muted p-4">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">HTML</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8" 
              onClick={copyHtml}
            >
              {copiedField === 'HTML' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Copy
            </Button>
          </div>
          <pre className="text-xs bg-black/80 text-white p-2 rounded overflow-x-auto">
            <code>{`<img src="${image.url}" alt="${image.alt || ''}" ${image.width ? `width="${image.width}"` : ''} ${image.height ? `height="${image.height}"` : ''} />`}</code>
          </pre>
        </div>
        
        <div className="flex flex-col space-y-2 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Markdown</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8" 
              onClick={copyMarkdown}
            >
              {copiedField === 'Markdown' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Copy
            </Button>
          </div>
          <pre className="text-xs bg-black/80 text-white p-2 rounded overflow-x-auto">
            <code>{`![${image.alt || image.filename}](${image.url})`}</code>
          </pre>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={viewOriginal}>
          <ArrowUpRight className="h-4 w-4 mr-2" />
          View Original
        </Button>
        <Button className="bg-primary text-white" onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
}