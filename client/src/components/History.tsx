import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, ArrowRight, Clock, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';

type HistoryItem = {
  url: string;
  date: string;
  imageCount: number;
};

interface HistoryProps {
  onSelectUrl: (url: string) => void;
}

export default function History({ onSelectUrl }: HistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load history from localStorage on component mount
  useEffect(() => {
    const loadHistory = () => {
      try {
        const historyString = localStorage.getItem('imageExtractorHistory');
        if (historyString) {
          const parsedHistory = JSON.parse(historyString);
          setHistory(parsedHistory);
        }
      } catch (error) {
        console.error('Error loading history:', error);
      }
    };

    loadHistory();
    
    // Set up event listener to refresh history when it changes in another component
    window.addEventListener('historyUpdated', loadHistory);
    
    return () => {
      window.removeEventListener('historyUpdated', loadHistory);
    };
  }, []);

  // Format the URL for display
  const formatUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
    } catch (e) {
      return url;
    }
  };

  // Format the date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  // Handle selection of a URL
  const handleSelectUrl = (url: string) => {
    onSelectUrl(url);
    setIsOpen(false);
  };

  // Clear history
  const clearHistory = () => {
    try {
      localStorage.removeItem('imageExtractorHistory');
      setHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center border-gray-800 bg-gray-900/50 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <HistoryIcon className="mr-2 h-4 w-4" />
          <span>History</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-gray-900 border border-gray-800 text-gray-100 p-0 overflow-hidden">
        <div className="space-y-4 p-4">
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <h4 className="font-medium text-white">Recent Extractions</h4>
            {history.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearHistory} 
                className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-gray-800"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <div className="bg-gray-800/50 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-8 w-8 opacity-40 text-gray-500" />
              </div>
              <p>No history yet</p>
              <p className="text-xs mt-1 text-gray-500">Recently extracted URLs will appear here</p>
            </div>
          ) : (
            <ScrollArea className="h-60 pr-2">
              <div className="space-y-2">
                {history.map((item, index) => (
                  <div 
                    key={index} 
                    className="p-3 hover:bg-gray-800 rounded-md cursor-pointer transition border border-gray-800/50"
                    onClick={() => handleSelectUrl(item.url)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium truncate mr-2 text-emerald-400">
                        {formatUrl(item.url)}
                      </div>
                      <div className="text-xs bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded-full">
                        {item.imageCount} images
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-gray-500">
                        {formatDate(item.date)}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 rounded-full hover:bg-emerald-500/10 hover:text-emerald-400 text-gray-500 p-0"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}