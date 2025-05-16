import { Clipboard, Search, Download } from "lucide-react";

export default function HowItWorks() {
  return (
    <div id="how-it-works" className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Extract images from any website in just a few simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="w-16 h-16 bg-blue-100 text-primary text-2xl rounded-full flex items-center justify-center mx-auto mb-4">
              <Clipboard className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">1. Paste URL</h3>
            <p className="text-gray-600">
              Enter any website URL in the input field at the top of the page.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="w-16 h-16 bg-blue-100 text-primary text-2xl rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">2. Extract Images</h3>
            <p className="text-gray-600">
              Click the Extract button and our system will scan the webpage for all images.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="w-16 h-16 bg-blue-100 text-primary text-2xl rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">3. Download</h3>
            <p className="text-gray-600">
              Browse the extracted images and download individual ones or all at once.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
