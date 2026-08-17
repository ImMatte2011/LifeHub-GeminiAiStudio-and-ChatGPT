import React, { useState, useEffect } from 'react';
import {
  Palette,
  Check,
  Sparkles,
  Sliders,
  X,
  RotateCcw,
  Sun,
  Moon,
  CheckCircle2,
} from 'lucide-react';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primaryHex: string;
  primaryClass: string;
  accentClass: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'blue',
    name: 'LifeHub Classic Blue',
    description: 'Crisp, professional high-contrast blue for analytical workflows.',
    primaryHex: '#2563eb',
    primaryClass: 'blue',
    accentClass: 'from-blue-600 to-indigo-700',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
  },
  {
    id: 'indigo',
    name: 'Deep Indigo',
    description: 'Modern twilight tone, balanced and elegant for second brains.',
    primaryHex: '#4f46e5',
    primaryClass: 'indigo',
    accentClass: 'from-indigo-600 to-violet-700',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    description: 'Organic, calm green palette promoting focus and clarity.',
    primaryHex: '#059669',
    primaryClass: 'emerald',
    accentClass: 'from-emerald-600 to-teal-700',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
  },
  {
    id: 'violet',
    name: 'Royal Violet',
    description: 'Refined deep purple for creative research and knowledge vaults.',
    primaryHex: '#7c3aed',
    primaryClass: 'violet',
    accentClass: 'from-violet-600 to-purple-800',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
  },
  {
    id: 'rose',
    name: 'Crimson Rose',
    description: 'Vibrant modern rose tone with bold contrast.',
    primaryHex: '#e11d48',
    primaryClass: 'rose',
    accentClass: 'from-rose-600 to-pink-700',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
  },
  {
    id: 'amber',
    name: 'Warm Amber Gold',
    description: 'Warm, earthy ochre and golden hues with soft ambient warmth.',
    primaryHex: '#d97706',
    primaryClass: 'amber',
    accentClass: 'from-amber-600 to-orange-700',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
  },
  {
    id: 'teal',
    name: 'Oceanic Teal',
    description: 'Clean sea-green gradient balancing vitality and minimalism.',
    primaryHex: '#0d9488',
    primaryClass: 'teal',
    accentClass: 'from-teal-600 to-cyan-700',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    badgeBorder: 'border-teal-200',
  },
  {
    id: 'slate',
    name: 'Minimalist Monochrome',
    description: 'Neutral architectural grayscale with subtle charcoal accents.',
    primaryHex: '#334155',
    primaryClass: 'slate',
    accentClass: 'from-slate-700 to-slate-900',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-300',
  },
];

interface ThemePaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: string;
  onSelectTheme: (themeId: string) => void;
}

export const ThemePaletteModal: React.FC<ThemePaletteModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Customize Color Palette</h3>
              <p className="text-[11px] text-slate-500">
                Choose your preferred primary accent palette for navigation, badges, and controls.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Presets Grid */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider">
            Primary Palette Presets
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {THEME_PRESETS.map((preset) => {
              const isSelected = activeTheme === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectTheme(preset.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full shadow-xs border border-white"
                        style={{ backgroundColor: preset.primaryHex }}
                      />
                      <span className="font-bold text-xs text-slate-900">{preset.name}</span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Instant Live Styling
            </div>
            <p className="text-[11px] text-slate-500">
              Palette selections are applied instantly across domain cards, graph views, and instance telemetry headers.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onSelectTheme('blue')}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3 h-3" /> Reset Default (Blue)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
