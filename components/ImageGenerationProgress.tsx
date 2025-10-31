import React from 'react';
import { useImageGenerationBatch } from '../hooks/useImageGenerationBatch';
import { LoadingSpinner, AlertTriangleIcon } from './icons/Icons';

const ImageGenerationProgress: React.FC = () => {
    const { processingIds, queueSize, totalEnqueued, isRateLimited } = useImageGenerationBatch();

    const inProgress = processingIds.size > 0 || queueSize > 0;
    if (!inProgress || totalEnqueued === 0) {
        return null;
    }

    const completed = totalEnqueued - queueSize - processingIds.size;

    if (isRateLimited) {
        return (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg flex items-center text-sm">
                <AlertTriangleIcon className="h-5 w-5 mr-3" />
                <span>
                    Queue paused due to API rate limit. Resuming in 5 minutes...
                </span>
            </div>
        );
    }


    return (
        <div className="mb-4 p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg flex items-center text-sm">
            <LoadingSpinner className="h-5 w-5 mr-3" />
            <span>
                Generating recipe images... ({completed} / {totalEnqueued})
            </span>
        </div>
    );
};

export default ImageGenerationProgress;
