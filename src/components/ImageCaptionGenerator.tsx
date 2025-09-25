"use client";
import React, { useState } from "react";
import Image from "next/image";


interface Caption {
  id: string;
  image: string;
  raw: string; // raw AI response
  options: string[]; // parsed caption options
  timestamp: Date;
}

export default function ImageCaptionGenerator() {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const generateCaption = async (imageFile: File) => {
    setIsLoading(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(imageFile);
      });

      const response = await fetch("/api/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, prompt: "Generate a creative and engaging caption for this image, perfect for WhatsApp or social media. Make it fun, descriptive, and shareable!" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || "Unknown error"}`);
      }

      const data = await response.json();

      const parseCaption = (text: string) => {
        if (!text) return [""];

        // remove obvious UI tokens anywhere in the text first
        let normalized = text.replace(/📋\s*Copy/gi, "").replace(/💬\s*Share/gi, "");

        const cleanOption = (s: string) => {
          return s
            // remove bold markers and surrounding asterisks
            .replace(/\*\*/g, "")
            // strip leftover Option labels like 'Option 1' if they remained
            .replace(/^\s*Option\s*\d+[:\)]?\s*/i, "")
            // remove leading/trailing quotes and extra whitespace
            .trim()
            .replace(/^"|"$/g, "");
        };

        const stripHeaderLines = (s: string) => {
          const lines = s.split(/\n+/).map(l => l.trim()).filter(Boolean);
          let i = 0;
          while (i < lines.length) {
            const l = lines[i];
            // drop lines that are just copy/share or emoji UI markers
            if (/^(📋\s*Copy|💬\s*Share)$/i.test(l)) { i++; continue; }
            // drop option header lines like '**Option 1 (Playful):**' or 'Option 1: Playful'
            if (/^\*{0,2}\s*Option\s*\d+/i.test(l)) { i++; continue; }
            // drop short header-like lines that end with ':' or are parenthetical categories
            if (l.length < 60 && /[:\-–—]$/.test(l)) { i++; continue; }
            // if line is just a short single-word category in parentheses, drop it
            if (/^\(?[A-Za-z\s&-]{1,30}\)?$/.test(l) && l.length < 40 && /\(/.test(l)) { i++; continue; }
            break;
          }
          return lines.slice(i).join(' ');
        };

        // First, split on double newlines which commonly separate options
        let parts = normalized.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
        if (parts.length <= 1) {
          // try splitting by lines that look like option headers or numbered lists
          parts = normalized.split(/(?=\*\*Option|^Option\s+\d+[:\)]|^\d+\.)/im).map(s => s.trim()).filter(Boolean);
        }

        if (parts.length <= 1) {
          const lines = normalized.split(/\n+/).map(s => s.trim()).filter(Boolean);
          if (lines.length > 1 && lines.some(l => l.length < 120)) {
            parts = lines;
          } else {
            const sentences = normalized.split(/(?<=\.|!|\?)\s+/).map(s => s.trim()).filter(Boolean);
            if (sentences.length > 1 && sentences.length <= 10) parts = sentences;
          }
        }

        // Clean headers and UI tokens per part, then dedupe
        const cleaned = parts
          .map(p => stripHeaderLines(p))
          .map(p => cleanOption(p))
          .map(s => s.replace(/^"|"$/g, ""))
          .filter(Boolean);

        return cleaned.length > 0 ? Array.from(new Set(cleaned)) : [cleanOption(normalized)];
      };

      const options = parseCaption(data.caption || "");
      const newCaption: Caption = { id: `caption-${Date.now()}`, image: base64, raw: data.caption || "", options, timestamp: new Date() };
      setCaptions((prev) => [newCaption, ...prev]);
    } catch (error) {
      console.error("Frontend Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to generate caption: ${errorMessage}\n\nCheck the browser console for more details.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) generateCaption(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) generateCaption(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast("Caption copied to clipboard!");
      setTimeout(() => setToast(null), 2200);
    } catch (err) {
      console.warn("Copy to clipboard failed:", err);
      const fallback = prompt("Copy the caption below:", text);
      if (!fallback) console.warn("User dismissed fallback copy prompt");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">WhatsApp Caption Generator</h1>
        <p className="text-gray-600">Upload an image and get an AI-generated caption perfect for social media!</p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-8 transition-colors ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"} ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById("fileInput")?.click()}
      >
        <div className="space-y-4">
          <div className="text-4xl">📸</div>
          <div>
            <p className="text-lg font-medium text-gray-700">{isLoading ? "Generating caption..." : "Upload an image"}</p>
            <p className="text-sm text-gray-500 mt-2">Click here or drag and drop your image</p>
            <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG, GIF, WebP</p>
          </div>
        </div>

        <input id="fileInput" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={isLoading} />
      </div>

      {isLoading && (
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">AI is analyzing your image...</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {captions.map((item) => (
          <div key={item.id} className="rounded-lg shadow-md overflow-hidden card-glass">
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/2 h-64 lg:h-auto">
                <div className="relative h-full">
                  
                  <Image src={item.image} alt="Uploaded" className="img-portrait w-full" unoptimized fill sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
              </div>
              <div className="lg:w-1/2 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 lg:mb-0 mb-4">Generated Caption</h3>
                    <span className="timestamp">{item.timestamp.toLocaleString()}</span>
                  </div>

                  <div className="caption-highlight p-6 rounded-lg mb-4">
                    {item.options.map((opt, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === item.options.length - 1;
                      return (
                        <div key={idx} className="mb-3">
                          <p className="text-gray-800 leading-relaxed text-lg whitespace-pre-line break-words">{opt}</p>
                          {!isFirst && !isLast && (
                            <div className="mt-2 flex gap-2">
                              <button onClick={() => copyToClipboard(opt)} className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm">📋 Copy</button>
                              <a href={`https://wa.me/?text=${encodeURIComponent(opt)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 border rounded-lg text-sm text-gray-700 hover:bg-gray-100">💬 Share</a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 items-center">
               
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {captions.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 mt-8">Upload your first image to get started! 🚀</div>
      )}

      {/* Toast/snackbar */}
      {toast && (
        <div className="fixed right-6 bottom-6 z-50">
          <div className="bg-black text-white px-4 py-2 rounded-lg shadow-lg opacity-95">{toast}</div>
        </div>
      )}
    </div>
  );
}
