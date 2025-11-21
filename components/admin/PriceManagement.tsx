// components/admin/PriceManagement.tsx
import React, { useState } from 'react';
import {
  ExtractedPrice,
  parseFacebookPostText,
  processManualFacebookPost
} from '../../services/facebookScraperService';

interface ExtractedPriceWithEdit extends ExtractedPrice {
  id: string;
  isEditing: boolean;
}

const PriceManagement: React.FC = () => {
  const [postText, setPostText] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [extractedPrices, setExtractedPrices] = useState<ExtractedPriceWithEdit[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleExtract = () => {
    if (!postText.trim()) {
      alert('Please paste some Facebook post text first!');
      return;
    }

    const prices = parseFacebookPostText(postText);
    const pricesWithEdit = prices.map((price, idx) => ({
      ...price,
      id: `price-${Date.now()}-${idx}`,
      isEditing: false
    }));

    setExtractedPrices(pricesWithEdit);
    setSaveResult(null);
  };

  const handleSaveToDatabase = async () => {
    if (extractedPrices.length === 0) {
      alert('No prices to save!');
      return;
    }

    setIsProcessing(true);
    setSaveResult(null);

    try {
      const result = await processManualFacebookPost(
        postText,
        postUrl || undefined
      );
      setSaveResult(result);

      // Clear form on success
      if (result.success > 0) {
        setPostText('');
        setPostUrl('');
        setExtractedPrices([]);
      }
    } catch (error) {
      setSaveResult({
        success: 0,
        failed: extractedPrices.length,
        errors: [`Error: ${error}`]
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const updatePrice = (id: string, field: keyof ExtractedPrice, value: any) => {
    setExtractedPrices(prev =>
      prev.map(price =>
        price.id === id ? { ...price, [field]: value } : price
      )
    );
  };

  const removePrice = (id: string) => {
    setExtractedPrices(prev => prev.filter(price => price.id !== id));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.85) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      {/* Instructions Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <span>ℹ️</span> How to Use
        </h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
          <li>Go to Global Food Markets Facebook page</li>
          <li>Copy the text from their latest price post</li>
          <li>Paste it in the text area below</li>
          <li>Click "Extract Prices" to parse the data</li>
          <li>Review extracted prices (edit if needed)</li>
          <li>Click "Save to Database" to store in Supabase</li>
        </ol>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📋</span> Facebook Post Data
        </h2>

        <div className="space-y-4">
          {/* Post URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post URL (optional)
            </label>
            <input
              type="text"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://facebook.com/globalfoodmarkets/posts/..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Post Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Paste Facebook post text here...&#10;&#10;Example:&#10;Bitter Melon $3.99/kg&#10;Fresh Coriander $2.00 bunch&#10;Okra - $4.50 per kg"
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {/* Extract Button */}
          <button
            onClick={handleExtract}
            disabled={!postText.trim()}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <span>🔍</span> Extract Prices
          </button>
        </div>
      </div>

      {/* Extracted Prices */}
      {extractedPrices.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>💰</span> Extracted Prices ({extractedPrices.length})
            </h2>
            <button
              onClick={handleSaveToDatabase}
              disabled={isProcessing || extractedPrices.length === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin">⏳</span> Saving...
                </>
              ) : (
                <>
                  <span>💾</span> Save to Database
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            {extractedPrices.map((price) => (
              <div
                key={price.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {price.produceName}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(
                          price.confidence
                        )}`}
                      >
                        {getConfidenceLabel(price.confidence)} ({Math.round(price.confidence * 100)}%)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          Price per kg
                        </label>
                        <div className="text-lg font-bold text-green-700">
                          {price.pricePerKg ? `$${price.pricePerKg.toFixed(2)}` : '-'}
                        </div>
                      </div>

                      {price.pricePerUnit && (
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">
                            Price per {price.unitType}
                          </label>
                          <div className="text-lg font-bold text-green-700">
                            ${price.pricePerUnit.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded italic">
                      "{price.rawText}"
                    </div>
                  </div>

                  <button
                    onClick={() => removePrice(price.id)}
                    className="ml-4 text-red-500 hover:text-red-700 transition-colors"
                    title="Remove this price"
                  >
                    <span className="text-xl">🗑️</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Result */}
      {saveResult && (
        <div
          className={`rounded-lg p-6 ${
            saveResult.success > 0
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <h3
            className={`font-semibold mb-2 flex items-center gap-2 ${
              saveResult.success > 0 ? 'text-green-900' : 'text-red-900'
            }`}
          >
            {saveResult.success > 0 ? (
              <>
                <span>✅</span> Save Complete
              </>
            ) : (
              <>
                <span>❌</span> Save Failed
              </>
            )}
          </h3>

          <div className="space-y-2">
            {saveResult.success > 0 && (
              <p className="text-green-800">
                Successfully saved {saveResult.success} price{saveResult.success !== 1 ? 's' : ''} to the database.
              </p>
            )}

            {saveResult.failed > 0 && (
              <p className="text-red-800">
                Failed to save {saveResult.failed} price{saveResult.failed !== 1 ? 's' : ''}.
              </p>
            )}

            {saveResult.errors.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-red-900 mb-1">Errors:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                  {saveResult.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Example Format */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Example Post Format:</h3>
        <pre className="text-sm text-gray-700 font-mono whitespace-pre-wrap">
          {`Fresh Produce Specials This Week! 🛒

Bitter Melon $3.99/kg
Fresh Coriander $2.00 bunch
Okra - $4.50 per kg
Green Chilies $5.99/kg
Fresh Turmeric $6.50 per kilo
Curry Leaves $3.00 bunch
Spinach $4.00/kg
Eggplant $3.50 per kg`}
        </pre>
      </div>
    </div>
  );
};

export default PriceManagement;
