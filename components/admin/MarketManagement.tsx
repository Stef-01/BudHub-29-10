// components/admin/MarketManagement.tsx
import React, { useState, useEffect } from 'react';
import { getLoganMarkets, updateMarket, deleteMarket, createMarket } from '../../services/marketService';
import type { Market } from '../../types/logan';

const MarketManagement: React.FC = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadMarkets();
  }, []);

  const loadMarkets = async () => {
    setLoading(true);
    const data = await getLoganMarkets();
    setMarkets(data);
    setLoading(false);
  };

  const handleEdit = (market: Market) => {
    setEditingMarket(market);
    setShowAddForm(false);
  };

  const handleDelete = async (marketId: string) => {
    if (!confirm('Are you sure you want to deactivate this market?')) return;

    const result = await deleteMarket(marketId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Market deactivated successfully' });
      loadMarkets();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to deactivate market' });
    }
  };

  const handleSave = async (marketData: Partial<Market>) => {
    if (editingMarket) {
      // Update existing
      const result = await updateMarket(editingMarket.id, marketData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Market updated successfully' });
        setEditingMarket(null);
        loadMarkets();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update market' });
      }
    }
  };

  const handleAdd = async (marketData: Omit<Market, 'id' | 'created_at' | 'updated_at'>) => {
    const result = await createMarket(marketData);
    if (result.success) {
      setMessage({ type: 'success', text: 'Market created successfully' });
      setShowAddForm(false);
      loadMarkets();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create market' });
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-3xl mb-2">🏪</div>
          <p className="text-gray-600">Loading markets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Market Management</h2>
            <p className="text-gray-600">Manage Logan area markets and their information</p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingMarket(null);
            }}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <span>+</span> Add Market
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="float-right text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingMarket) && (
        <MarketForm
          market={editingMarket}
          onSave={editingMarket ? handleSave : handleAdd}
          onCancel={() => {
            setEditingMarket(null);
            setShowAddForm(false);
          }}
        />
      )}

      {/* Markets List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          All Markets ({markets.length})
        </h3>

        <div className="space-y-3">
          {markets.map((market) => (
            <div
              key={market.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    {market.name}
                    {market.has_indian_produce && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        Indian Produce
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">{market.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>{' '}
                      <span className="text-gray-600 capitalize">{market.type?.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Suburb:</span>{' '}
                      <span className="text-gray-600">{market.suburb || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Day:</span>{' '}
                      <span className="text-gray-600">
                        {market.day_of_week !== null ? dayNames[market.day_of_week] : 'Daily'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Hours:</span>{' '}
                      <span className="text-gray-600">
                        {market.start_time && market.end_time
                          ? `${market.start_time.slice(0, 5)} - ${market.end_time.slice(0, 5)}`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {market.address && (
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Address:</span> {market.address}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(market)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(market.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {markets.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No markets found</p>
            <p className="text-sm mt-2">Add your first market above</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Market Form Component
interface MarketFormProps {
  market: Market | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const MarketForm: React.FC<MarketFormProps> = ({ market, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: market?.name || '',
    type: market?.type || 'market',
    description: market?.description || '',
    suburb: market?.suburb || '',
    address: market?.address || '',
    day_of_week: market?.day_of_week !== null && market?.day_of_week !== undefined ? market.day_of_week : -1,
    start_time: market?.start_time || '',
    end_time: market?.end_time || '',
    website_url: market?.website_url || '',
    facebook_url: market?.facebook_url || '',
    has_indian_produce: market?.has_indian_produce || false,
    is_active: market?.is_active !== undefined ? market.is_active : true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      day_of_week: formData.day_of_week === -1 ? null : formData.day_of_week,
    };

    onSave(submitData);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        {market ? 'Edit Market' : 'Add New Market'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Market Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="market">Market</option>
              <option value="indian_grocery">Indian Grocery</option>
              <option value="general_grocery">General Grocery</option>
            </select>
          </div>

          {/* Suburb */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Suburb</label>
            <input
              type="text"
              value={formData.suburb}
              onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Address */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value={-1}>Daily (Open Every Day)</option>
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
            </select>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
            <input
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Facebook URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
            <input
              type="url"
              value={formData.facebook_url}
              onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Checkboxes */}
          <div className="col-span-2 flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.has_indian_produce}
                onChange={(e) => setFormData({ ...formData, has_indian_produce: e.target.checked })}
                className="w-4 h-4 text-green-600"
              />
              <span className="text-sm font-medium text-gray-700">Has Indian Produce</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-green-600"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            {market ? 'Update Market' : 'Create Market'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MarketManagement;
