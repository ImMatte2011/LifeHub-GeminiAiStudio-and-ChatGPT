import React, { useState } from 'react';
import { Tag as TagIcon, Plus, X, Check } from 'lucide-react';
import { Tag } from '../../types/index.js';

interface TagPickerProps {
  allTags: Tag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  onCreateTag?: (name: string, color: string) => Promise<void>;
}

export const TagPicker: React.FC<TagPickerProps> = ({
  allTags,
  selectedTagIds,
  onChange,
  onCreateTag,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [isCreating, setIsCreating] = useState(false);

  const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#ef4444', '#14b8a6'];

  const toggleTag = (id: string) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter((t) => t !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || !onCreateTag) return;
    try {
      await onCreateTag(newTagName.trim(), newTagColor);
      setNewTagName('');
      setIsCreating(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 min-h-[36px] p-2 bg-slate-50 border border-slate-200 rounded-lg">
        {selectedTagIds.length === 0 ? (
          <span className="text-xs text-slate-400 italic flex items-center gap-1">
            <TagIcon className="w-3.5 h-3.5" /> No tags assigned
          </span>
        ) : (
          selectedTagIds.map((id) => {
            const tag = allTags.find((t) => t.id === id);
            if (!tag) return null;
            return (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor: `${tag.color}15`,
                  borderColor: `${tag.color}40`,
                  color: tag.color,
                }}
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className="hover:opacity-75 focus:outline-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="ml-auto text-xs px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 transition-colors shadow-2xs font-medium"
        >
          <Plus className="w-3 h-3" /> Manage
        </button>
      </div>

      {isOpen && (
        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xl space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Select Tags
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
            {allTags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900 border-2'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                  style={{
                    borderColor: isSelected ? tag.color : undefined,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                  {isSelected && <Check className="w-3 h-3 text-emerald-600" />}
                </button>
              );
            })}
          </div>

          {onCreateTag && (
            <div className="border-t border-slate-100 pt-2">
              {!isCreating ? (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Create new tag
                </button>
              ) : (
                <form onSubmit={handleCreate} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tag label..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex items-center gap-1">
                      {colors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewTagColor(c)}
                          className={`w-4 h-4 rounded-full transition-transform ${
                            newTagColor === c ? 'scale-125 ring-2 ring-blue-600 ring-offset-1 ring-offset-white' : ''
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newTagName.trim()}
                      className="px-2.5 py-0.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
                    >
                      Save Tag
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
