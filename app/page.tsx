"use client";
import React, { useState } from "react";
import { GenerateImageResponse } from "./api/generate-image/route";

export default function Home() {
  const [userEvent, setUserEvent] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");

    try {
      const promptRes = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEvent }),
      });
      const { prompt } = await promptRes.json();
      setGeneratedPrompt(prompt);

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data: GenerateImageResponse = await response.json();

      if (data.success && data.images) {
        setImages(data.images);
      } else {
        setError(data.error || "An error occurred");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-purple-100 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-8">
          <h1 className="text-4xl font-bold mb-6 text-gray-800">
            Mascot Image Generator
          </h1>
          <div className="flex items-center space-x-4 mb-8">
            <input
              type="text"
              value={userEvent}
              onChange={(e) => setUserEvent(e.target.value)}
              placeholder="Describe the event (e.g., waving a flag)"
              className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 text-black  focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleGenerate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate"
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
              <p>{error}</p>
            </div>
          )}


          {images.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Generated Images</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {images.map((url, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <img
                      src={url}
                      alt={`Generated mascot ${index + 1}`}
                      className="w-24 h-24 object-cover"
                      />
                    <div className="p-4">
                      <p className="text-sm text-gray-500 break-all">{url}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {generatedPrompt && (
            <div className="mb-8 mt-8 bg-gray-100 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2 text-gray-800">Generated Prompt</h2>
              <p className="text-gray-700">{generatedPrompt}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}