// components/admin/FoodImageUploader.tsx
import React, { useState } from 'react';
import { FOOD_LIBRARY } from '../../services/nutriServeFoodData';
import { uploadFoodImage, getFoodImage } from '../../services/foodImageDataset';

interface UploadedImage {
  foodId: string;
  previewUrl: string;
}

const FoodImageUploader: React.FC = () => {
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string>('');

  // Flatten all food items from all groups
  const allFoodItems = FOOD_LIBRARY.flatMap(group =>
    group.items.map(item => ({
      id: item.id,
      label: item.label,
      category: item.category
    }))
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFoodId) {
      setMessage('Please select a food item first');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file');
      return;
    }

    setUploading(true);
    setMessage('Uploading...');

    try {
      await uploadFoodImage(selectedFoodId, file);

      // Get the uploaded image for preview
      const imageState = await getFoodImage(selectedFoodId);

      if (imageState) {
        setUploadedImages(prev => [
          ...prev.filter(img => img.foodId !== selectedFoodId),
          {
            foodId: selectedFoodId,
            previewUrl: imageState.urls.preview
          }
        ]);
        setMessage(`✓ Successfully uploaded image for ${allFoodItems.find(f => f.id === selectedFoodId)?.label}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(`✗ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const loadExistingImages = async () => {
    setMessage('Loading existing images...');
    const loaded: UploadedImage[] = [];

    for (const item of allFoodItems) {
      const imageState = await getFoodImage(item.id);
      if (imageState) {
        loaded.push({
          foodId: item.id,
          previewUrl: imageState.urls.preview
        });
      }
    }

    setUploadedImages(loaded);
    setMessage(`Loaded ${loaded.length} existing images`);
  };

  React.useEffect(() => {
    loadExistingImages();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-green-800 mb-6">Food Image Dataset Manager</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Instructions:</strong> Upload images for each food item. Images are processed into 3 sizes
          (original, preview, thumbnail) and stored permanently in SQLite. All users will see these images.
        </p>
      </div>

      {/* Upload Form */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Upload New Image</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Food Item
            </label>
            <select
              value={selectedFoodId}
              onChange={(e) => setSelectedFoodId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={uploading}
            >
              <option value="">-- Choose a food item --</option>
              {FOOD_LIBRARY.map(group => (
                <optgroup key={group.name} label={group.name}>
                  {group.items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Image File
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={!selectedFoodId || uploading}
              className="w-full p-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg ${
              message.startsWith('✓') ? 'bg-green-50 text-green-800' :
              message.startsWith('✗') ? 'bg-red-50 text-red-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Images Grid */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Uploaded Images ({uploadedImages.length})</h3>
          <button
            onClick={loadExistingImages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploadedImages.map(img => {
            const foodItem = allFoodItems.find(f => f.id === img.foodId);
            return (
              <div key={img.foodId} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100">
                  <img
                    src={img.previewUrl}
                    alt={foodItem?.label}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 bg-white">
                  <p className="font-semibold text-sm text-gray-800">{foodItem?.label}</p>
                  <p className="text-xs text-gray-500">{foodItem?.category}</p>
                </div>
              </div>
            );
          })}
        </div>

        {uploadedImages.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No images uploaded yet</p>
            <p className="text-sm mt-2">Start by selecting a food item and uploading an image above</p>
          </div>
        )}
      </div>

      {/* Bulk Upload Stats */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-700 mb-2">Dataset Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Total Food Items</p>
            <p className="text-2xl font-bold text-gray-800">{allFoodItems.length}</p>
          </div>
          <div>
            <p className="text-gray-500">Images Uploaded</p>
            <p className="text-2xl font-bold text-green-600">{uploadedImages.length}</p>
          </div>
          <div>
            <p className="text-gray-500">Remaining</p>
            <p className="text-2xl font-bold text-orange-600">{allFoodItems.length - uploadedImages.length}</p>
          </div>
          <div>
            <p className="text-gray-500">Coverage</p>
            <p className="text-2xl font-bold text-blue-600">
              {Math.round((uploadedImages.length / allFoodItems.length) * 100)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodImageUploader;
