import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink, ShieldAlert, Globe, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onTryAgain: () => void;
}

export default function ErrorState({ 
  message = "We couldn't extract images from this URL. Please check the URL and try again, or try a different website.", 
  onTryAgain 
}: ErrorStateProps) {
  // Extract specific error types to provide better guidance
  const isForbiddenError = message.includes("Forbidden") || message.includes("403");
  const isNotFoundError = message.includes("Not Found") || message.includes("404");
  
  let errorTitle = "Extraction Failed";
  let errorDetails = message;
  let suggestedAction = "";
  let ErrorIcon = AlertCircle;
  
  if (isForbiddenError) {
    errorTitle = "Website Access Restricted";
    errorDetails = "This website has protections that prevent image extraction. This commonly happens with sites like Instagram, Pinterest, and stock photo websites.";
    suggestedAction = "Try a different website that allows public access to its images.";
    ErrorIcon = ShieldAlert;
  } else if (isNotFoundError) {
    errorTitle = "Website Not Found";
    errorDetails = "The URL you entered doesn't seem to exist or is no longer available.";
    suggestedAction = "Please check the URL and try again.";
    ErrorIcon = Globe;
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-gray-900/70 border border-gray-800 p-6 rounded-xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <ErrorIcon className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-medium text-white">{errorTitle}</h3>
          <p className="mt-2 text-gray-400 max-w-lg">
            {errorDetails}
          </p>
          
          {suggestedAction && (
            <p className="mt-3 text-emerald-400 font-medium">{suggestedAction}</p>
          )}
        </div>
        
        <div className="bg-gray-800/50 border border-gray-800 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-white mb-3 flex items-center">
            <Globe className="h-4 w-4 mr-2 text-emerald-500" />
            Try these websites instead:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault(); 
                onTryAgain();
                // You could set a specific URL here
              }}
              className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline px-3 py-2 rounded-md bg-gray-800/50 flex items-center"
            >
              <span className="font-mono text-xs bg-gray-800 rounded px-1 py-0.5 mr-2">developer.mozilla.org</span>
              <span className="text-gray-400">Developer docs</span>
            </a>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault(); 
                onTryAgain();
                // You could set a specific URL here
              }}
              className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline px-3 py-2 rounded-md bg-gray-800/50 flex items-center"
            >
              <span className="font-mono text-xs bg-gray-800 rounded px-1 py-0.5 mr-2">en.wikipedia.org</span>
              <span className="text-gray-400">Wikipedia articles</span>
            </a>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault(); 
                onTryAgain();
                // You could set a specific URL here
              }}
              className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline px-3 py-2 rounded-md bg-gray-800/50 flex items-center"
            >
              <span className="font-mono text-xs bg-gray-800 rounded px-1 py-0.5 mr-2">news.ycombinator.com</span>
              <span className="text-gray-400">Tech news</span>
            </a>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault(); 
                onTryAgain();
                // You could set a specific URL here
              }}
              className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline px-3 py-2 rounded-md bg-gray-800/50 flex items-center"
            >
              <span className="font-mono text-xs bg-gray-800 rounded px-1 py-0.5 mr-2">github.com</span>
              <span className="text-gray-400">GitHub projects</span>
            </a>
          </div>
          <p className="mt-3 text-xs text-gray-500">Note: Some websites implement protection against accessing their content programmatically.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3">
          <Button 
            variant="default"
            onClick={onTryAgain}
            className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            Start Over
          </Button>
        </div>
      </div>
    </div>
  );
}
