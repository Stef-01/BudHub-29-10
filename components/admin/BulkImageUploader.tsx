// components/admin/BulkImageUploader.tsx
import React, { useState, useRef } from 'react';
import { seedFoodImages, seedRecipeImages, validateImageFiles, type SeedProgress } from '../../services/bulkImageSeed';

type UploadType = 'food' | 'recipe';

interface UploadLog {
  itemId: string;
  status: 'success' | 'error';
  message: string;
}

const BulkImageUploader: React.FC = () => {
  const [uploadType, setUploadType] = useState<UploadType>('food');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<SeedProgress | null>(null);
  const [logs, setLogs] = useState<UploadLog[]>([]);
  const [summary, setSummary] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      return;
    }

    // Validate files
    const { valid, invalid } = validateImageFiles(files);

    if (invalid.length > 0) {
      const invalidLog: UploadLog[] = invalid.map(({ filename, reason }) => ({
        itemId: filename,
        status: 'error',
        message: `✗ Validation failed: ${reason}`,
      }));
      setLogs(prev => [...prev, ...invalidLog]);
    }

    if (valid.length === 0) {
      alert('No valid image files found. Please check file types and sizes.');
      return;
    }

    // Start upload
    setUploading(true);
    setLogs([]);
    setSummary(null);
    setProgress(null);

    const uploadLogs: UploadLog[] = [];

    const handleProgress = (prog: SeedProgress) => {
      setProgress(prog);
      if (prog.message) {
        uploadLogs.push({
          itemId: prog.itemId,
          status: prog.status === 'error' ? 'error' : 'success',
          message: prog.message,
        });
        setLogs([...uploadLogs]);
      }
    };

    try {
      let result;
      if (uploadType === 'food') {
        result = await seedFoodImages(valid, handleProgress);
      } else {
        result = await seedRecipeImages(valid, handleProgress);
      }

      setSummary({ success: result.success, failed: result.failed });

      // Add any additional errors
      if (result.errors.length > 0) {
        const errorLogs: UploadLog[] = result.errors.map(({ itemId, error }) => ({
          itemId,
          status: 'error',
          message: `✗ Error: ${error}`,
        }));
        setLogs(prev => [...prev, ...errorLogs]);
      }
    } catch (error) {
      console.error('Bulk upload failed:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
      setProgress(null);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectFolder = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-green-800 mb-4">Bulk Image Upload</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">📁 How to Use Bulk Upload</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Place your labeled images in a folder on your computer</li>
          <li>Name each image file as the food/recipe ID (e.g., <code>rice_white.jpg</code>)</li>
          <li>Select upload type (Food or Recipe)</li>
          <li>Click "Select Folder" and choose your folder</li>
          <li>System will process and upload all valid images</li>
        </ol>
        <p className="text-xs text-blue-600 mt-2">
          💡 <strong>Tip:</strong> See <code>public/dataset/food-images/README.md</code> for complete naming guide
        </p>
      </div>

      {/* Upload Type Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Type
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => setUploadType('food')}
            disabled={uploading}
            className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
              uploadType === 'food'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
            } disabled:opacity-50`}
          >
            🍽️ Food Images
            <div className="text-xs mt-1">For NutriServe game</div>
          </button>
          <button
            onClick={() => setUploadType('recipe')}
            disabled={uploading}
            className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
              uploadType === 'recipe'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
            } disabled:opacity-50`}
          >
            📖 Recipe Images
            <div className="text-xs mt-1">For Recipe Book</div>
          </button>
        </div>
      </div>

      {/* File Input (Hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFolderSelect}
        className="hidden"
        {...({ webkitdirectory: '', directory: '' } as any)}
      />

      {/* Select Folder Button */}
      <button
        onClick={handleSelectFolder}
        disabled={uploading}
        className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors ${
          uploading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {uploading ? 'Uploading...' : '📁 Select Folder with Images'}
      </button>

      {/* Progress */}
      {progress && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Processing: {progress.itemId}
            </span>
            <span className="text-sm text-gray-600">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Upload Complete!</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{summary.success}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{summary.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Logs */}
      {logs.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-700 mb-2">Upload Log</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="space-y-1 font-mono text-xs">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`${
                    log.status === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes</h3>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li>File names must match item IDs exactly (case-sensitive)</li>
          <li>Supported formats: JPG, PNG, WebP, GIF</li>
          <li>Maximum file size: 10MB per image</li>
          <li>Images are auto-resized to: original, 800px, 200px</li>
          <li>Processing may take a few minutes for large datasets</li>
        </ul>
      </div>
    </div>
  );
};

export default BulkImageUploader;
