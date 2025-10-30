import { useContext } from 'react';
import { ImageGenerationContext, ImageGenerationContextType } from '../contexts/ImageGenerationContext';

export const useImageGenerationBatch = (): ImageGenerationContextType => {
    const context = useContext(ImageGenerationContext);
    if (context === undefined) {
        throw new Error('useImageGenerationBatch must be used within an ImageGenerationProvider');
    }
    return context;
};
