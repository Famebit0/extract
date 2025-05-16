import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Globe, InfoIcon } from "lucide-react";
import History from "./History";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface URLFormProps {
  onSubmit: (url: string) => void;
}

const EXAMPLE_URLS = [
  "https://developer.mozilla.org/en-US/docs/Web/HTML",
  "https://news.ycombinator.com/",
  "https://en.wikipedia.org/wiki/Web_scraping",
  "https://github.com/trending"
];

export default function URLForm({ onSubmit }: URLFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(false);

  const isValidUrl = (urlString: string): boolean => {
    // Check for empty URL
    if (!urlString.trim()) return false;
    
    // Add https:// if missing
    let processedUrl = urlString;
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      processedUrl = 'https://' + urlString;
    }
    
    try {
      new URL(processedUrl);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    // Add https:// if missing
    let processedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      processedUrl = 'https://' + url;
    }
    
    if (!isValidUrl(processedUrl)) {
      setError("Please enter a valid URL (e.g., example.com or https://example.com)");
      return;
    }

    setError(null);
    onSubmit(processedUrl);
  };
  
  const handleHistorySelect = (selectedUrl: string) => {
    setUrl(selectedUrl);
    onSubmit(selectedUrl);
  };
  
  const setExampleUrl = (exampleUrl: string) => {
    setUrl(exampleUrl);
    setShowExamples(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <form 
        className="flex flex-col md:flex-row rounded-xl overflow-hidden bg-gray-900/50 border border-gray-800"
        onSubmit={handleSubmit}
      >
        <div className="relative flex-grow">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            <Globe className="h-5 w-5" />
          </div>
          <Input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="Enter website URL (e.g., mozilla.org or https://example.com)"
            className="flex-grow pl-10 pr-12 py-6 bg-transparent text-white focus:outline-none text-base border-0 focus-visible:ring-0 focus-visible:ring-transparent placeholder:text-gray-500"
          />
          <Popover open={showExamples} onOpenChange={setShowExamples}>
            <PopoverTrigger asChild>
              <Button 
                type="button"
                variant="ghost" 
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <InfoIcon className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-gray-900 border border-gray-800 text-gray-300" align="end">
              <div className="p-4">
                <h3 className="font-medium mb-2 text-white">Example URLs to try:</h3>
                <ul className="space-y-2">
                  {EXAMPLE_URLS.map((exampleUrl, index) => (
                    <li key={index}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-400 p-1 h-auto hover:bg-gray-800 hover:underline w-full justify-start"
                        onClick={() => setExampleUrl(exampleUrl)}
                      >
                        {exampleUrl.replace("https://", "")}
                      </Button>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-400 mt-3">
                  Note: Some websites block image extraction. Public sites like Wikipedia, MDN, and open source projects work best.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Button 
          type="submit" 
          className="bg-emerald-500 text-white px-6 py-5 font-medium text-sm hover:bg-emerald-600 transition flex items-center justify-center h-auto rounded-none border-0 border-l border-gray-800"
        >
          <span>Extract</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
      
      <div className="flex justify-between items-center mt-3">
        {error && (
          <div className="text-left text-red-400 font-medium text-sm">
            {error}
          </div>
        )}
        <div className={error ? "ml-auto" : "w-full flex justify-end"}>
          <History onSelectUrl={handleHistorySelect} />
        </div>
      </div>
    </div>
  );
}
