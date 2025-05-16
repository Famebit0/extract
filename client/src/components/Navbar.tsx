import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-gray-800 bg-gray-900/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="rounded-lg bg-emerald-500/20 p-1.5 mr-2">
                <ImageIcon className="h-5 w-5 text-emerald-500" />
              </div>
              <span className="font-semibold text-lg text-white">Image Extractor</span>
              <span className="text-gray-500 text-xs ml-2 mt-1">v1.0</span>
            </div>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-6">
            <a href="#how-it-works" className="text-gray-300 hover:text-white text-sm">How It Works</a>
            <a href="#features" className="text-gray-300 hover:text-white text-sm">Features</a>
            <a href="#" className="text-gray-300 hover:text-white text-sm">API</a>
            
            <div className="pl-6 flex space-x-3">
              <Button 
                variant="ghost" 
                className="text-gray-300 hover:text-white border-0 hover:bg-gray-800"
              >
                Login
              </Button>
              <Button 
                className="bg-emerald-500 hover:bg-emerald-600 text-white border-0"
              >
                Sign Up
              </Button>
            </div>
          </div>
          <div className="flex md:hidden items-center">
            <Button
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute z-50 w-full bg-gray-900 border-b border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#how-it-works" className="block px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md">How It Works</a>
            <a href="#features" className="block px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md">Features</a>
            <a href="#" className="block px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md">API</a>
            <div className="pt-4 pb-3 border-t border-gray-800">
              <div className="flex items-center justify-between px-3">
                <Button className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-white">Sign Up</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
