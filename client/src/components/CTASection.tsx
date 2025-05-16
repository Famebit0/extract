import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <div className="bg-primary py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Ready to Extract Images?</h2>
        <p className="text-white text-xl mb-8 max-w-3xl mx-auto">
          Try ImageExtractor now for free. No registration required.
        </p>
        <Button className="bg-white text-primary hover:bg-gray-100 transition px-8 py-6 text-lg h-auto">
          Get Started for Free
        </Button>
        <p className="text-blue-200 mt-4">No credit card required. Upgrade anytime.</p>
      </div>
    </div>
  );
}
