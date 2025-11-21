// components/AdminView.tsx
import React, { useState } from 'react';
import FoodImageUploader from './admin/FoodImageUploader';
import BulkImageUploader from './admin/BulkImageUploader';
import PriceManagement from './admin/PriceManagement';
import MarketManagement from './admin/MarketManagement';
import ProduceManagement from './admin/ProduceManagement';

type AdminTab = 'bulk' | 'single' | 'prices' | 'markets' | 'produce';

const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('bulk');

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h1 className="text-3xl font-bold text-green-800 mb-2 flex items-center gap-2">
          <span className="text-2xl">🛠️</span> Admin Panel
        </h1>
        <p className="text-gray-600 mb-4">
          Manage food and recipe images. All uploads are permanent and visible to all users.
        </p>

        {/* Tab Selector */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === 'bulk'
                ? 'text-green-700 border-b-2 border-green-700 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            📁 Bulk Upload
          </button>
          <button
            onClick={() => setActiveTab('single')}
            className={`px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === 'single'
                ? 'text-green-700 border-b-2 border-green-700 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            🖼️ Single Upload
          </button>
          <button
            onClick={() => setActiveTab('prices')}
            className={`px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === 'prices'
                ? 'text-green-700 border-b-2 border-green-700 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            💰 Price Scraper
          </button>
          <button
            onClick={() => setActiveTab('markets')}
            className={`px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === 'markets'
                ? 'text-green-700 border-b-2 border-green-700 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            🏪 Markets
          </button>
          <button
            onClick={() => setActiveTab('produce')}
            className={`px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === 'produce'
                ? 'text-green-700 border-b-2 border-green-700 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            🥬 Produce
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'bulk' && <BulkImageUploader />}
        {activeTab === 'single' && <FoodImageUploader />}
        {activeTab === 'prices' && <PriceManagement />}
        {activeTab === 'markets' && <MarketManagement />}
        {activeTab === 'produce' && <ProduceManagement />}
      </div>
    </div>
  );
};

export default AdminView;
