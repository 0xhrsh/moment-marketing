// app/page.tsx
"use client";
import React, { useState } from "react";
import { jsPDF } from "jspdf";


interface GeneratePromptResponse {
  description?: string;
  story?: string;
  prompts?: string[];
  error?: string;
}

interface GenerateImageResponse {
  success: boolean;
  images?: string[];
  error?: string;
  status: "processing" | "succeeded" | "failed";
}

export default function Home() {
  // Step Management
  const [step, setStep] = useState(1);

  // Step 1: Image Upload
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");

  // Step 2: Character Description
  const [characterDescription, setCharacterDescription] = useState("");
  const [editedCharacterDescription, setEditedCharacterDescription] =
    useState("");

  // Step 3: Event Input
  const [userEvent, setUserEvent] = useState("");
  const [shortStory, setShortStory] = useState("");
  const [editedShortStory, setEditedShortStory] = useState("");

  // Step 4: Image Prompts
  const [imagePrompts, setImagePrompts] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);

  // Common States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState("");

  // Helper Functions
  const getImageDataUrl = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous"); // To avoid CORS issues

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject("Cannot get canvas context");
          return;
        }

        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      };

      img.onerror = () => {
        reject("Cannot load image");
      };

      img.src = url;
    });
  };

  // PDF Generation Function
  const generatePDF = async () => {
    if (images.length === 0) {
      alert("No images available to generate PDF.");
      return;
    }

    setPdfGenerating(true);
    setPdfError("");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // Margin from page edges in mm
    const spacing = 5; // Space between images in mm
    const borderWidth = 1; // Border thickness in mm

    // Define grid layout: 2 columns
    const columns = 2;
    const rows = Math.ceil(images.length / columns);
    
    // Calculate available width and height per image, considering spacing
    const imageWidth = (pageWidth - 2 * margin - (columns - 1) * spacing) / columns;
    const imageHeight = (pageHeight - 2 * margin - (rows - 1) * spacing) / rows;

    try {
      // Set border properties
      pdf.setLineWidth(borderWidth);
      pdf.setDrawColor(0, 0, 0); // Black borders

      for (let i = 0; i < images.length; i++) {
        const imgUrl = images[i];
        const imgData = await getImageDataUrl(imgUrl);

        // Calculate row and column for current image
        const col = i % columns;
        const row = Math.floor(i / columns);

        // Calculate x and y positions
        const x = margin + col * (imageWidth + spacing);
        const y = margin + row * (imageHeight + spacing);

        // Add image to PDF
        pdf.addImage(imgData, "PNG", x, y, imageWidth, imageHeight);

        // Draw border around the image
        pdf.rect(x, y, imageWidth, imageHeight);
      }

      // Save the PDF with the specified name
      pdf.save("story-book.pdf");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      setPdfError("Failed to generate PDF. Please try again.");
    } finally {
      setPdfGenerating(false);
    }
  };
  // Handle Image Upload
  const handleImageUpload = async () => {
    if (!uploadedImage) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", uploadedImage);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setImageUrl(data.url);
        // Proceed to generate character description
        const promptRes = await fetch("/api/generate-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "character", imageUrl: data.url }),
        });

        const promptData: GeneratePromptResponse = await promptRes.json();

        if (promptRes.ok) {
          setCharacterDescription(promptData.description || "");
          setEditedCharacterDescription(promptData.description || "");
          setStep(2);
        } else {
          setError(
            promptData.error || "Failed to generate character description"
          );
        }
      } else {
        setError(data.error || "Failed to upload image");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during image upload.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Event Submission
  const handleEventSubmit = async () => {
    if (!userEvent) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "story", event: userEvent }),
      });

      const data: GeneratePromptResponse = await response.json();
      console.log("API Response:", data);

      if (response.ok) {
        setShortStory(data.story || "");
        setEditedShortStory(data.story || "");
        setStep(4);
      } else {
        setError(data.error || "Failed to generate short story");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during story generation.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Final Submission to Generate Image Prompts
  const handleFinalSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "image-prompts",
          story: editedShortStory,
        }),
      });

      const data: GeneratePromptResponse = await response.json();

      if (response.ok) {
        setImagePrompts(data.prompts || []);
        setStep(5);
      } else {
        setError(data.error || "Failed to generate image prompts");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during prompt generation.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Image Generation from Prompts
  const handleGenerateImages = async () => {
    setLoading(true);
    setError("");
    setImages([]);

    try {
      const generatedImages: string[] = [];
      for (const prompt of imagePrompts) {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        const data: GenerateImageResponse = await response.json();

        if (response.ok && data.success && data.images) {
          generatedImages.push(...data.images);
        } else {
          setError(data.error || "Failed to generate some images");
          break;
        }
      }

      setImages(generatedImages);
      setStep(6);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during image generation.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">
            Event-based Cartoon Story Generator 🎨
          </h1>

          {error && (
            <div
              className="bg-red-900 border-l-4 border-red-500 text-red-100 p-4 mb-4"
              role="alert"
            >
              <p>{error}</p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Step 1: Upload Image
              </h2>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadedImage(e.target.files[0]);
                  }
                }}
                className="mb-4"
              />
              <button
                onClick={handleImageUpload}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                disabled={loading || !uploadedImage}
              >
                {loading
                  ? "Uploading... 🤔"
                  : "Upload and Generate Character Description"}
              </button>
              {uploadedImage && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(uploadedImage)}
                    alt="Uploaded"
                    className="w-48 h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Step 2: Character Description
              </h2>
              <textarea
                value={editedCharacterDescription}
                onChange={(e) => setEditedCharacterDescription(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={5}
              />
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => setStep(3)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                >
                  Approve
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                >
                  Edit Image
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Step 3: Enter Event
              </h2>
              <input
                type="text"
                value={userEvent}
                onChange={(e) => setUserEvent(e.target.value)}
                placeholder="Describe the event"
                className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              />
              <button
                onClick={handleEventSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                disabled={loading || !userEvent}
              >
                {loading ? "Generating... 🤔" : "Generate Short Story"}
              </button>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Step 4: Short Story
              </h2>
              <textarea
                value={editedShortStory}
                onChange={(e) => setEditedShortStory(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={7}
              />
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => setStep(5)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                >
                  Approve
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                >
                  Edit Event
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Step 5: Generate Image Prompts
              </h2>
              <button
                onClick={handleFinalSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                disabled={loading}
              >
                {loading
                  ? "Generating Prompts... 🤔"
                  : "Generate Image Prompts"}
              </button>
              {imagePrompts.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold">Generated Prompts:</h3>
                  <div className="space-y-4">
                    {imagePrompts.map((prompt, index) => (
                      <div key={index} className="flex flex-col">
                        <label className="mb-1">Prompt {index + 1}:</label>
                        <textarea
                          value={prompt}
                          onChange={(e) => {
                            const newPrompts = [...imagePrompts];
                            newPrompts[index] = e.target.value;
                            setImagePrompts(newPrompts);
                          }}
                          className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={6}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleGenerateImages}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out mt-4"
                    disabled={loading}
                  >
                    {loading
                      ? "Generating Images... 🤔"
                      : "Generate Images from Prompts"}
                  </button>
                </div>
              )}
            </div>
          )}

{step === 6 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Step 6: Generated Images</h2>
              {images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((imageUrl, index) => (
                    <div key={index} className="relative">
                      <img
                        src={imageUrl}
                        alt={`Generated Image ${index + 1}`}
                        className="w-full h-auto object-cover rounded-lg"
                      />
                      <a
                        href={imageUrl}
                        download={`generated_image_${index + 1}.png`}
                        className="absolute bottom-2 right-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded-lg"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No images generated.</p>
              )}
              <div className="flex items-center mt-4">
                <button
                  onClick={generatePDF}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                  disabled={pdfGenerating}
                >
                  {pdfGenerating ? "Generating PDF... 🤔" : "Download PDF"}
                </button>
                <button
                  onClick={() => {
                    // Reset all states to start over
                    setStep(1);
                    setUploadedImage(null);
                    setImageUrl("");
                    setCharacterDescription("");
                    setEditedCharacterDescription("");
                    setUserEvent("");
                    setShortStory("");
                    setEditedShortStory("");
                    setImagePrompts([]);
                    setImages([]);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out ml-2"
                >
                  Start Over
                </button>
              </div>
              {pdfError && (
                <div className="bg-red-900 border-l-4 border-red-500 text-red-100 p-4 mt-4" role="alert">
                  <p>{pdfError}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}