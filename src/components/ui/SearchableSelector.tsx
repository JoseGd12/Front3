import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import ImageRenderer from './ImageRenderer';

interface SearchableSelectorProps<T> {
  items: T[];
  onSelectItem: (item: T) => void;
  placeholder: string;
  searchFields: (keyof T)[];
  renderOption: (item: T) => React.ReactNode;
  label: string;
  showError?: boolean;
  shakeClass?: string;
}

const normalizeSearchText = (value: unknown): string => {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export function SearchableSelector<T extends { id: any }>({
  items,
  onSelectItem,
  placeholder,
  searchFields,
  renderOption,
  label,
  showError,
  shakeClass,
}: SearchableSelectorProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedItemDisplay, setSelectedItemDisplay] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm) return [];
    const query = normalizeSearchText(searchTerm);
    return items.filter(item => {
      const searchableText = searchFields.map(field => normalizeSearchText(item[field])).join(' ');
      return searchableText.includes(query);
    }).slice(0, 50);
  }, [searchTerm, items, searchFields]);

  const handleSelect = (item: T) => {
    onSelectItem(item);
    // This is a bit of a hack to get a display value.
    // It assumes the first search field is the primary display field.
    setSelectedItemDisplay(String(item[searchFields[0]]));
    setShowResults(false);
    setSearchTerm(String(item[searchFields[0]]));
  };

  return (
    <div className="space-y-2 relative">
      <label className="text-white-primary flex items-center gap-2">{label}</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-lighter pointer-events-none z-10" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className={`elegante-input pl-11 w-full ${showError ? `border-red-500 ring-1 ring-red-500 ${shakeClass}` : ''}`}
        />
        {showResults && searchTerm.trim() !== '' && (
          <div className="absolute z-50 w-full mt-2 bg-gray-darkest border border-gray-dark rounded-xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in duration-200">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="p-3 border-b border-gray-dark hover:bg-gray-dark transition-colors cursor-pointer group"
                >
                  {renderOption(item)}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-lightest italic">
                No se encontraron resultados.
              </div>
            )}
          </div>
        )}
      </div>
      {showError && <p className="text-xs text-red-400 mt-1">Debes seleccionar un ítem del buscador.</p>}
    </div>
  );
}
