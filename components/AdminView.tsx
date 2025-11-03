// components/AdminView.tsx
import React from 'react';
import FoodImageUploader from './admin/FoodImageUploader';

const AdminView: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-4xl font-bold text-green-800 mb-2">Admin Panel</h1>
          <p className="text-gray-600">
            Manage the food image dataset. Upload images that will be displayed to all users.
          </p>
        </div>

        <FoodImageUploader />
      </div>
    </div>
  );
};

export default AdminView;
