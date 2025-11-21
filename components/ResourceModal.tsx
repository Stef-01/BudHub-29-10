// components/ResourceModal.tsx
import React from 'react';
import type { Resource } from '../types/logan';

interface ResourceModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
}

const ResourceModal: React.FC<ResourceModalProps> = ({ resource, isOpen, onClose }) => {
  if (!isOpen || !resource) return null;

  const formatIcon = resource.format === 'pdf' ? '📄' : resource.format === 'video' ? '🎥' : '🌐';

  const topicColors: Record<string, string> = {
    'Indian food culture': 'from-orange-500 to-orange-600',
    'healthy eating': 'from-green-500 to-green-600',
    'diabetes management': 'from-red-500 to-red-600',
    'healthy cooking': 'from-yellow-500 to-yellow-600',
    'lifestyle program': 'from-blue-500 to-blue-600',
    'medical services': 'from-purple-500 to-purple-600',
  };

  const topicGradient = topicColors[resource.topic] || 'from-gray-500 to-gray-600';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-br ${topicGradient} p-8 relative overflow-hidden`}>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full opacity-10 blur-3xl"></div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-all"
          >
            ✕
          </button>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl mb-4">
              {formatIcon}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {resource.title}
            </h2>
            <p className="text-white text-opacity-90 font-medium">
              {resource.organization}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
              Description
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {resource.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                Language
              </h3>
              <p className="text-gray-900 font-medium">{resource.language}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                Format
              </h3>
              <p className="text-gray-900 font-medium capitalize">{resource.format}</p>
            </div>

            {resource.target_audience && (
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Audience
                </h3>
                <p className="text-gray-900 font-medium capitalize">
                  {resource.target_audience.replace('_', ' ')}
                </p>
              </div>
            )}

            {resource.is_local && (
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Location
                </h3>
                <p className="text-gray-900 font-medium">Logan/Brisbane Area</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full bg-gradient-to-r ${topicGradient} text-white font-bold py-4 px-6 rounded-2xl hover:shadow-xl transition-all text-center`}
            >
              Open Resource →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceModal;
