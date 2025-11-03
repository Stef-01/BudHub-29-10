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
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 sm:p-6 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-4">📤 Bulk Image Upload</h2>

      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-3 sm:p-4 mb-6 shadow-sm">
        <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base flex items-center gap-2">
          <span>📁</span> How to Use Bulk Upload
        </h3>
        <ol className="text-xs sm:text-sm text-blue-800 space-y-1.5 list-decimal list-inside leading-relaxed">
          <li>Place your labeled images in a folder on your computer</li>
          <li>Name each image file as the food/recipe ID (e.g., <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">rice_white.jpg</code>)</li>
          <li>Select upload type (Food or Recipe)</li>
          <li>Click "Select Folder" and choose your folder</li>
          <li>System will process and upload all valid images</li>
        </ol>
        <p className="text-xs text-blue-700 mt-3 bg-blue-100 p-2 rounded-lg">
          💡 <strong>Tip:</strong> See <code className="bg-white px-1 py-0.5 rounded">public/dataset/food-images/README.md</code> for complete naming guide
        </p>
      </div>

      {/* Upload Type Selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          📂 Upload Type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={() => setUploadType('food')}
            disabled={uploading}
            className={`py-3 px-4 rounded-xl border-2 font-medium transition-all shadow-sm ${
              uploadType === 'food'
                ? 'border-green-500 bg-green-50 text-green-700 shadow-green-100 ring-2 ring-green-200'
                : 'border-gray-300 bg-white text-gray-600 hover:border-green-400 hover:shadow-md'
            } disabled:opacity-50`}
          >
            <div className="text-2xl mb-1">🍽️</div>
            <div className="font-semibold">Food Images</div>
            <div className="text-xs mt-1 opacity-75">For NutriServe game</div>
          </button>
          <button
            onClick={() => setUploadType('recipe')}
            disabled={uploading}
            className={`py-3 px-4 rounded-xl border-2 font-medium transition-all shadow-sm ${
              uploadType === 'recipe'
                ? 'border-green-500 bg-green-50 text-green-700 shadow-green-100 ring-2 ring-green-200'
                : 'border-gray-300 bg-white text-gray-600 hover:border-green-400 hover:shadow-md'
            } disabled:opacity-50`}
          >
            <div className="text-2xl mb-1">📖</div>
            <div className="font-semibold">Recipe Images</div>
            <div className="text-xs mt-1 opacity-75">For Recipe Book</div>
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
        className={`w-full py-4 px-6 rounded-xl font-bold text-base sm:text-lg transition-all shadow-lg ${
          uploading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:shadow-xl transform hover:-translate-y-0.5'
        }`}
      >
        {uploading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            Uploading...
          </span>
        ) : (
          '📁 Select Folder with Images'
        )}
      </button>

      {/* Progress */}
      {progress && (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-800">
              Processing: <span className="text-green-600">{progress.itemId}</span>
            </span>
            <span className="text-sm font-bold text-gray-700 bg-white px-3 py-1 rounded-full shadow-sm">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-4 shadow-inner">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-600 text-center">
            {Math.round((progress.current / progress.total) * 100)}% Complete
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="mt-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-xl p-5 shadow-lg">
          <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <span>🎉</span> Upload Complete!
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center bg-white rounded-xl p-4 shadow-md border border-green-200">
              <div className="text-4xl font-extrabold text-green-600">{summary.success}</div>
              <div className="text-sm font-medium text-gray-600 mt-1">Successful</div>
            </div>
            <div className="text-center bg-white rounded-xl p-4 shadow-md border border-red-200">
              <div className="text-4xl font-extrabold text-red-600">{summary.failed}</div>
              <div className="text-sm font-medium text-gray-600 mt-1">Failed</div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Logs */}
      {logs.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span>📝</span> Upload Log
          </h3>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 max-h-80 overflow-y-auto shadow-lg">
            <div className="space-y-1 font-mono text-xs leading-relaxed">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`py-1 ${
                    log.status === 'success'
                      ? 'text-green-400'
                      : 'text-red-400'
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
      <div className="mt-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-4 shadow-sm">
        <h3 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
          <span>⚠️</span> Important Notes
        </h3>
        <ul className="text-xs sm:text-sm text-yellow-800 space-y-2 list-disc list-inside leading-relaxed">
          <li><strong>File names</strong> must match item IDs exactly (case-sensitive)</li>
          <li><strong>Supported formats:</strong> JPG, PNG, WebP, GIF</li>
          <li><strong>Maximum file size:</strong> 10MB per image</li>
          <li><strong>Auto-resized to:</strong> original, 800px preview, 200px thumbnail</li>
          <li><strong>Processing time:</strong> May take a few minutes for large datasets</li>
        </ul>
      </div>
    </div>
  );
};

export default BulkImageUploader;
