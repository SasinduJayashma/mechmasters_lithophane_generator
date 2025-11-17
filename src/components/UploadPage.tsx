import { useStore } from '../store';
import { loadImage, imageToImageData } from '../utils/imageProcessing';

export function UploadPage() {
  const { setOriginalImage, setProcessedImageData, setCurrentPage } = useStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imgSrc = event.target?.result as string;
      setOriginalImage(imgSrc);

      // Load image and convert to ImageData
      const img = await loadImage(imgSrc);
      const imageData = imageToImageData(img);
      setProcessedImageData(imageData);

      // Navigate to edit page
      setCurrentPage('edit');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imgSrc = event.target?.result as string;
      setOriginalImage(imgSrc);

      // Load image and convert to ImageData
      const img = await loadImage(imgSrc);
      const imageData = imageToImageData(img);
      setProcessedImageData(imageData);

      // Navigate to edit page
      setCurrentPage('edit');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Lithophane Generator
          </h1>
          <p className="text-gray-300">
            Upload your image to create a stunning 3D lithophane
          </p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-4 border-dashed border-gray-600 rounded-xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-900"
        >
          <svg
            className="mx-auto h-16 w-16 text-gray-500 mb-4"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="mb-4">
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block font-medium"
            >
              Select Image
            </label>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <p className="text-sm text-gray-400">or drag and drop your image here</p>
          <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
        </div>

        <div className="mt-8 bg-blue-900 border-l-4 border-blue-500 p-4 rounded border border-blue-700">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-300">
                For best results, use high-resolution images with good contrast.
                The recommended size is around 2874px × 1425px.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
