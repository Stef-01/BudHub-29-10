// components/admin/ProduceManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  getAllProduceItems,
  createProduceItem,
  updateProduceItem,
  deleteProduceItem,
  addNameVariation,
  removeNameVariation
} from '../../services/produceService';
import type { ProduceItem, ProduceCategory, GIRating } from '../../types/logan';

const ProduceManagement: React.FC = () => {
  const [produceItems, setProduceItems] = useState<ProduceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ProduceItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadProduceItems();
  }, []);

  const loadProduceItems = async () => {
    setLoading(true);
    const data = await getAllProduceItems();
    setProduceItems(data);
    setLoading(false);
  };

  const handleEdit = (item: ProduceItem) => {
    setEditingItem(item);
    setShowAddForm(false);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this produce item? This will also delete all associated price data.')) return;

    const result = await deleteProduceItem(itemId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Produce item deleted successfully' });
      loadProduceItems();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete produce item' });
    }
  };

  const handleSave = async (itemData: Partial<ProduceItem>) => {
    if (editingItem) {
      const result = await updateProduceItem(editingItem.id, itemData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Produce item updated successfully' });
        setEditingItem(null);
        loadProduceItems();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update produce item' });
      }
    }
  };

  const handleAdd = async (itemData: Omit<ProduceItem, 'id' | 'created_at' | 'updated_at'>) => {
    const result = await createProduceItem(itemData);
    if (result.success) {
      setMessage({ type: 'success', text: 'Produce item created successfully' });
      setShowAddForm(false);
      loadProduceItems();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create produce item' });
    }
  };

  const filteredItems = produceItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name_variations?.some(v => v.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-3xl mb-2">🥬</div>
          <p className="text-gray-600">Loading produce items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Produce Management</h2>
            <p className="text-gray-600">Manage produce items and their variations</p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingItem(null);
            }}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <span>+</span> Add Produce
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mt-4">
          <input
            type="text"
            placeholder="Search by name or variation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Categories</option>
            <option value="vegetable">Vegetable</option>
            <option value="spice">Spice</option>
            <option value="grain">Grain</option>
            <option value="herb">Herb</option>
            <option value="fruit">Fruit</option>
          </select>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingItem) && (
        <ProduceForm
          item={editingItem}
          onSave={editingItem ? handleSave : handleAdd}
          onCancel={() => {
            setShowAddForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* Produce Items List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Produce Items ({filteredItems.length})
        </h3>

        {filteredItems.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No produce items found</p>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <ProduceItemRow
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Form Component
interface ProduceFormProps {
  item: ProduceItem | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const ProduceForm: React.FC<ProduceFormProps> = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    name_variations: item?.name_variations?.join(', ') || '',
    category: item?.category || 'vegetable',
    is_indian_staple: item?.is_indian_staple || false,
    emoji: item?.emoji || '',
    nutritional_notes: item?.nutritional_notes || '',
    gi_rating: item?.gi_rating || 'medium'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      name_variations: formData.name_variations
        .split(',')
        .map(v => v.trim().toLowerCase())
        .filter(v => v.length > 0)
    };

    onSave(data);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {item ? 'Edit Produce Item' : 'Add New Produce Item'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Bitter Melon"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emoji
            </label>
            <input
              type="text"
              value={formData.emoji}
              onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
              maxLength={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="🥒"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name Variations (comma-separated)
          </label>
          <input
            type="text"
            value={formData.name_variations}
            onChange={(e) => setFormData({ ...formData, name_variations: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="karela, bitter gourd, pavakkai"
          />
          <p className="text-xs text-gray-500 mt-1">
            Alternative names for better price scraping accuracy
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="vegetable">Vegetable</option>
              <option value="spice">Spice</option>
              <option value="grain">Grain</option>
              <option value="herb">Herb</option>
              <option value="fruit">Fruit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GI Rating
            </label>
            <select
              value={formData.gi_rating}
              onChange={(e) => setFormData({ ...formData, gi_rating: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_indian_staple}
                onChange={(e) => setFormData({ ...formData, is_indian_staple: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Indian Staple</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nutritional Notes
          </label>
          <textarea
            value={formData.nutritional_notes}
            onChange={(e) => setFormData({ ...formData, nutritional_notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="High in fiber, vitamin C, and antioxidants..."
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            {item ? 'Update' : 'Create'} Produce
          </button>
        </div>
      </form>
    </div>
  );
};

// Row Component
interface ProduceItemRowProps {
  item: ProduceItem;
  onEdit: (item: ProduceItem) => void;
  onDelete: (id: string) => void;
}

const ProduceItemRow: React.FC<ProduceItemRowProps> = ({ item, onEdit, onDelete }) => {
  const categoryColors: Record<string, string> = {
    vegetable: 'bg-green-100 text-green-800',
    spice: 'bg-orange-100 text-orange-800',
    grain: 'bg-yellow-100 text-yellow-800',
    herb: 'bg-emerald-100 text-emerald-800',
    fruit: 'bg-red-100 text-red-800'
  };

  const giColors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="text-3xl">{item.emoji || '🥬'}</div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">{item.name}</h4>
            {item.is_indian_staple && (
              <span className="inline-flex px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                Indian Staple
              </span>
            )}
            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${categoryColors[item.category || 'vegetable']}`}>
              {item.category}
            </span>
            {item.gi_rating && (
              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${giColors[item.gi_rating]}`}>
                GI: {item.gi_rating}
              </span>
            )}
          </div>

          {item.name_variations && item.name_variations.length > 0 && (
            <p className="text-sm text-gray-600">
              Also known as: {item.name_variations.join(', ')}
            </p>
          )}

          {item.nutritional_notes && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
              {item.nutritional_notes}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(item)}
          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default ProduceManagement;
