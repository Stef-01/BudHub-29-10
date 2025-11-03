// components/AdminView.tsx
import React, { useState } from 'react';
import FoodImageUploader from './admin/FoodImageUploader';
import BulkImageUploader from './admin/BulkImageUploader';

type AdminTab = 'bulk' | 'single';

const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('bulk');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-4xl font-bold text-green-800 mb-2">Admin Panel</h1>
          <p className="text-gray-600 mb-4">
            Manage food and recipe images. All uploads are permanent and visible to all users.
          </p>

          {/* Tab Selector */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'bulk'
                  ? 'text-green-700 border-b-2 border-green-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📁 Bulk Upload (Recommended)
            </button>
            <button
              onClick={() => setActiveTab('single')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'single'
                  ? 'text-green-700 border-b-2 border-green-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🖼️ Single Upload
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'bulk' ? <BulkImageUploader /> : <FoodImageUploader />}
      </div>
    </div>
  );
};

export default AdminView;
