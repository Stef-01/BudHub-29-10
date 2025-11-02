// components/games/nutriserve-ui/Plate.tsx
import React, { useState } from 'react';
import type { PlateItem } from '../NutriServeTypes';
import { IconTrash } from './Icons';

interface PlateItemDisplayProps {
    item: PlateItem;
    onEdit: (item: PlateItem) => void;
    onRemove: (instanceId: string) => void;
    position: { top: string; left: string; transform: string };
}

// Function to calculate visual scale based on serving size in grams.
const calculateScale = (grams: number): number => {
    // Define a reasonable range for grams and their corresponding visual scale.
    const minGrams = 30;  // e.g., one roti or a small chutney serving
    const maxGrams = 350; // e.g., a large serving of rice
    const minScale = 0.75; // 75% of base size
    const maxScale = 1.35; // 135% of base size

    // Clamp the grams to avoid extreme sizes outside our expected range.
    const clampedGrams = Math.max(minGrams, Math.min(grams, maxGrams));
    
    // Linearly interpolate the scale based on the grams.
    const scale = minScale + ((clampedGrams - minGrams) / (maxGrams - minGrams)) * (maxScale - minScale);
    
    return scale;
};


const PlateItemDisplay: React.FC<PlateItemDisplayProps> = ({ item, onEdit, onRemove, position }) => {
    const FoodVisual = item.foodItem.visual;
    const scale = calculateScale(item.grams);

    return (
        <div
            className="absolute group transition-all duration-300 hover:z-10"
            style={{ 
                ...position,
                transform: `${position.transform} scale(${scale})`,
                width: '96px', 
                height: '96px',
            }}
        >
            <div 
                onClick={() => onEdit(item)} 
                className="cursor-pointer p-2 w-full h-full transform transition-transform duration-300 group-hover:scale-110"
            >
                <FoodVisual grams={item.grams} />
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.instanceId);
                }}
                className="absolute top-0 right-0 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                style={{ transform: `scale(${1 / scale})` }} // Counteract parent's scale to keep button size consistent
                aria-label={`Remove ${item.foodItem.label}`}
            >
                <IconTrash className="w-4 h-4" />
            </button>
        </div>
    );
};

interface PlateProps {
    items: PlateItem[];
    onEditItem: (item: PlateItem) => void;
    onRemoveItem: (instanceId: string) => void;
    onDropItem: (foodItemId: string) => void;
    plateSize: 'Light' | 'Regular' | 'Hearty';
}

const Plate: React.FC<PlateProps> = ({ items, onEditItem, onRemoveItem, onDropItem, plateSize }) => {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        const foodItemId = e.dataTransfer.getData('foodItemId');
        if (foodItemId) {
            onDropItem(foodItemId);
        }
    };

    // Distribute items around the plate
    const getPosition = (index: number, total: number) => {
        if (total === 1) {
            return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        }
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // Start from top
        const radius = plateSize === 'Light' ? 25 : 30; // %
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        return { top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)' };
    };

    const plateSizeStyles = {
        Light: 'w-72 h-72 sm:w-80 sm:h-80',
        Regular: 'w-80 h-80 sm:w-96 sm:h-96',
        Hearty: 'w-96 h-96 sm:w-[420px] sm:h-[420px]',
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative mx-auto rounded-full bg-white shadow-inner transition-all duration-300 ${plateSizeStyles[plateSize]} ${isOver ? 'ring-4 ring-emerald-400' : 'ring-2 ring-slate-200'}`}
        >
            <div className="absolute inset-2 rounded-full border-2 border-dashed border-slate-300 pointer-events-none"></div>
            {items.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-slate-400 font-semibold text-lg">Drag food onto the plate</p>
                </div>
            )}
            {items.map((item, index) => (
                <PlateItemDisplay
                    key={item.instanceId}
                    item={item}
                    onEdit={onEditItem}
                    onRemove={onRemoveItem}
                    position={getPosition(index, items.length)}
                />
            ))}
        </div>
    );
};

export default Plate;