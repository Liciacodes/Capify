"use client";
import { useState } from "react";

interface Caption {
  id: string;
  image: string;
  caption: string;
  timestamp: Date;
}

export default function ImageCaptionGenerator() {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const generateCaption = async (imageFile: File) => {
    setIsLoading(true);

    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(imageFile);
      });

      const response = await fetch('/api/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          prompt: "Generate a creative and engaging caption for this image, perfect for WhatsApp or social media. Make it fun, descriptive, and shareable!"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      
      const newCaption: Caption = {
        id: `caption-${Date.now()}`,
        image: base64,
        caption: data.caption,
        timestamp: new Date(),
      };

      setCaptions(prev => [newCaption, ...prev]);
    } catch (error) {
      console.error('Frontend Error:', error);
      
      // Show more detailed error to user for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate caption: ${errorMessage}\n\nCheck the browser console for more details.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      generateCaption(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      generateCaption(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Caption copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          WhatsApp Caption Generator
        </h1>
        <p className="text-gray-600">
          Upload an image and get an AI-generated caption perfect for social media!
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-8 transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <div className="space-y-4">
          <div className="text-4xl">📸</div>
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isLoading ? 'Generating caption...' : 'Upload an image'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Click here or drag and drop your image
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports JPG, PNG, GIF, WebP
            </p>
          </div>
        </div>
        
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isLoading}
        />
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">AI is analyzing your image...</span>
          </div>
        </div>
      )}

      {/* Generated Captions */}
      <div className="space-y-6">
        {captions.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/2">
                <div className="relative">
                  <img
                    src={item.image}
                    alt="Uploaded"
                    className="w-full h-auto max-h-96 object-contain bg-gray-100"
                  />
                </div>
              </div>
              <div className="lg:w-1/2 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Generated Caption</h3>
                    <span className="text-xs text-gray-500">
                      {item.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-lg mb-4 border-l-4 border-blue-400">
                    <p className="text-gray-800 leading-loose text-lg whitespace-pre-line break-words">
                      {item.caption}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => copyToClipboard(item.caption)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors self-start"
                >
                  📋 Copy Caption
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {captions.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 mt-8">
          Upload your first image to get started! 🚀
        </div>
      )}
    </div>
  );
}
