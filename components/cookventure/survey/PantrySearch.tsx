// components/cookventure/survey/PantrySearch.tsx
// Ingredient search that understands Hindi and regional names ("tamatar" -> tomato).
import React, { useId, useMemo, useState } from 'react';
import { searchIngredients } from '../../../services/cookventure/ingredients';

interface PantrySearchProps {
  vocabulary: string[];
  selectedIngredients: string[];
  onToggleIngredient: (ingredient: string) => void;
}

const PantrySearch: React.FC<PantrySearchProps> = ({ vocabulary, selectedIngredients, onToggleIngredient }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const suggestions = useMemo(() => searchIngredients(query, vocabulary), [query, vocabulary]);
  const trimmed = query.trim().toLowerCase();
  const canAddCustom = trimmed.length > 1 && !suggestions.some((s) => s.item === trimmed);
  const options = [
    ...suggestions.map((s) => ({ item: s.item, alias: s.matchedAlias, custom: false })),
    ...(canAddCustom ? [{ item: trimmed, alias: undefined, custom: true }] : []),
  ];

  const choose = (item: string) => {
    if (!selectedIngredients.includes(item)) onToggleIngredient(item);
    setQuery('');
    setActiveIndex(0);
  };

  return (
    <div className="relative">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search ingredients
      </label>
      <div className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-3 focus-within:border-green-400">
        <span aria-hidden="true">🔎</span>
        <input
          id={`${listId}-input`}
          type="text"
          role="combobox"
          aria-expanded={options.length > 0}
          aria-controls={listId}
          aria-activedescendant={options.length > 0 ? `${listId}-${activeIndex}` : undefined}
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, options.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && options[activeIndex]) {
              e.preventDefault();
              choose(options[activeIndex].item);
            } else if (e.key === 'Escape') {
              setQuery('');
            }
          }}
          placeholder='Search in any language: "tamatar", "kariveppila", "dahi"…'
          className="w-full py-2.5 text-sm bg-transparent outline-none placeholder:text-gray-400"
        />
      </div>

      {options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
        >
          {options.map((option, idx) => {
            const isSelected = selectedIngredients.includes(option.item);
            return (
              <li
                key={`${option.item}-${option.custom}`}
                id={`${listId}-${idx}`}
                role="option"
                aria-selected={idx === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(option.item);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`flex items-center justify-between gap-3 px-3 py-2 text-sm cursor-pointer ${
                  idx === activeIndex ? 'bg-green-50' : ''
                }`}
              >
                <span className="text-gray-800">
                  {option.custom ? (
                    <>
                      Add “<strong>{option.item}</strong>”
                    </>
                  ) : (
                    <>
                      <strong className="font-semibold">{option.item}</strong>
                      {option.alias && <span className="text-gray-500"> · {option.alias}</span>}
                    </>
                  )}
                </span>
                {isSelected && <span className="text-xs text-green-700 font-semibold">✓ in pantry</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default PantrySearch;
