import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { ImageIcon, Search } from "lucide-react";

export default function LoadingState() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Slow down as we approach 90%
        const increment = prev < 30 ? 5 : prev < 60 ? 3 : prev < 80 ? 1 : 0.5;
        const newValue = Math.min(prev + increment, 90);
        return newValue;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="absolute -right-2 -top-2 w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-900">
            <Search className="h-4 w-4 text-white animate-pulse" />
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-emerald-500/20 border-t-emerald-500/80 rounded-full animate-spin"></div>
        </div>
        
        <h2 className="text-2xl font-semibold text-white mt-2">Finding Images</h2>
        <p className="text-gray-400">Please wait while we scan and extract images from the website...</p>
        
        <div className="bg-gray-800 w-full max-w-md rounded-full overflow-hidden">
          <Progress value={progress} className="h-2 bg-emerald-500" />
        </div>
        
        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
          <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-2">
            <div className="text-lg font-bold text-white">{Math.floor(progress/3)}</div>
            <div className="text-xs text-gray-500">Images Found</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-2">
            <div className="text-lg font-bold text-white">{Math.floor(progress)}%</div>
            <div className="text-xs text-gray-500">Progress</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-2">
            <div className="text-lg font-bold text-white">{Math.max(1, Math.floor(progress/30))}</div>
            <div className="text-xs text-gray-500">Seconds Left</div>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 max-w-xs mx-auto">
          We're checking all sources including background images, lazy-loaded content, and embedded resources
        </p>
      </div>
    </div>
  );
}
