import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TagInput({ label, placeholder, value = [], onChange, suggestions = [] }) {
  const [input, setInput] = useState('');

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (value.some(v => v.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...value, trimmed]);
    setInput('');
  };

  const removeTag = (tag) => {
    onChange(value.filter(v => v !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const filteredSuggestions = suggestions.filter(
    s => !value.some(v => v.toLowerCase() === s.toLowerCase()) &&
         s.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div>
      {label && <Label className="mb-1.5 block">{label}</Label>}
      <div className="flex flex-wrap gap-2 min-h-[40px] w-full rounded-md border border-input bg-transparent px-2 py-2 text-sm shadow-sm focus-within:ring-1 focus-within:ring-ring">
        {value.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 text-xs font-medium px-2 py-1 rounded-md"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-teal-900"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(input)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
        />
      </div>
      {filteredSuggestions.length > 0 && input && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {filteredSuggestions.slice(0, 6).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-teal-50 text-gray-600 hover:text-teal-700 px-2 py-1 rounded-md border border-gray-200"
            >
              <Plus className="w-3 h-3" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}