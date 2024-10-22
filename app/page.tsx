"use client";
import React, { useState } from "react";
import { GenerateImageResponse } from "./api/generate-image/route";

export default function Home() {
  const [userEvent, setUserEvent] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("what is my name ?");
  const [subjectUrl, setSubjectUrl] = useState("https://replicate.delivery/pbxt/L0gy7uyLE5UP0uz12cndDdSOIgw5R3rV5N6G2pbt7kEK9dCr/0_3.webp");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGeneratePrompt = async () => {
    setLoading(true);
    setError("");

    try {
      const promptRes = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEvent }),
      });
  
      if (!promptRes.ok) {
        const errorData = await promptRes.json();
        setError(errorData.error || "Failed to generate prompt");
        return;
      }
  
      const { prompt } = await promptRes.json();
      setGeneratedPrompt(prompt);
    } catch (error) {
      console.error("Error generating prompt:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitImage = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: generatedPrompt, subject: subjectUrl }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to generate image");
        return;
      }
  
      const data: GenerateImageResponse = await response.json();
  
      if (data.success && data.images) {
        setImages(data.images);
      } else if (data.status === 'processing') {
        setError('Image generation is taking longer than expected, please wait.');
      } else {
        setError(data.error || "An error occurred during image generation");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 flex flex-col lg:flex-row">
          <div className="lg:w-2/3 pr-4 mb-6 lg:mb-0">
            <h1 className="text-2xl font-bold mb-4">Event based Cartoon Generator 🎨</h1>
            <div className="flex space-x-2 mb-4">
              
             
              <input
              id="event"
                type="text"
                value={userEvent}
                onChange={(e) => setUserEvent(e.target.value)}
                placeholder="Describe the event"
                className="flex-grow p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              <button
                onClick={handleGeneratePrompt}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                disabled={loading}
              >
                {loading ? "Generating...🤔" : "Generate Prompt"}
              </button>
            </div>

           

            {error && (
              <div className="bg-red-900 border-l-4 border-red-500 text-red-100 p-4 mb-4" role="alert">
                <p>{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="generatedPrompt" className="text-gray-400">Generated Prompt(you can edit this):</label>
              {generatedPrompt && (
                <textarea
                  id="generatedPrompt"
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                  placeholder="Generated Prompt"
                  className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>

            <button
              onClick={handleSubmitImage}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out mt-4"
              disabled={loading}
            >
              {loading ? "Submitting...🤔" : "Submit for Image"}
            </button>
          </div>

          <div className="lg:w-2/3 lg:pl-4 flex flex-col">
            <div className="mb-4 flex-1">
              Generated Image:
              {images.length > 0 ? (
                images.map((imageUrl, index) => (
                  <div key={index} className="mt-4">
                    <img 
                      src={imageUrl}
                      alt={`Generated Image ${index + 1}`}
                      className="w-48 h-48 object-contain rounded-lg"
                    />
                    {/* Download Button */}
                    <a 
                      href={imageUrl} 
                      download={`generated_image_${index + 1}.png`} // Force download as .png
                      className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg inline-block"
                    >
                      Download Image
                    </a>
                  </div>))
              ) : (
                <div className="w-48 h-48 bg-gray-700 rounded-lg flex items-center justify-center text-center">
                  <p>Generated image will appear here 🤔</p>
                </div>
              )}
            </div>

            
          </div>
        </div>
      </div>
    </div>
  );
}
