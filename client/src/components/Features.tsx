import { 
  Bolt, Filter, Download, Lock, Code, Monitor 
} from "lucide-react";

export default function Features() {
  return (
    <div id="features" className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Extract, organize, and download images from any website with our powerful toolset.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-primary text-3xl mb-4">
              <Bolt className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Fast Extraction</h3>
            <p className="text-gray-600">
              Extract images from any website in seconds with our optimized algorithms.
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-primary text-3xl mb-4">
              <Filter className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Filtering</h3>
            <p className="text-gray-600">
              Filter images by size, type, and quality to find exactly what you need.
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-primary text-3xl mb-4">
              <Download className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Bulk Download</h3>
            <p className="text-gray-600">
              Download all images at once in a convenient ZIP archive.
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-primary text-3xl mb-4">
              <Lock className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
            <p className="text-gray-600">
              Your extractions are secure and private. We don't store your images.
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-primary text-3xl mb-4">
              <Code className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">API Access</h3>
            <p className="text-gray-600">
              Integrate image extraction into your own applications with our API.
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-primary text-3xl mb-4">
              <Monitor className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Browser Extension</h3>
            <p className="text-gray-600">
              Extract images directly from your browser with our extension.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
