import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext.js';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  itemName,
  confirmLabel,
  cancelLabel,
  isDangerous = true,
  onConfirm,
  onCancel,
}) => {
  const { language } = useLanguage();

  if (!isOpen) return null;

  const defaultTitle = language === 'it' ? 'Conferma Eliminazione' : 'Confirm Deletion';
  const defaultMessage =
    language === 'it'
      ? 'Sei sicuro di voler eliminare questo elemento? L\'operazione non può essere annullata.'
      : 'Are you sure you want to delete this item? This action cannot be undone.';
  const defaultConfirm = language === 'it' ? 'Elimina Definitivamente' : 'Delete Permanently';
  const defaultCancel = language === 'it' ? 'Annulla' : 'Cancel';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isDangerous ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
              }`}
            >
              {isDangerous ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {title || defaultTitle}
              </h3>
              {itemName && (
                <div className="text-xs font-semibold text-slate-700 mt-1 truncate bg-slate-100 px-2 py-0.5 rounded-md inline-block max-w-full">
                  {itemName}
                </div>
              )}
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {message || defaultMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            {cancelLabel || defaultCancel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition-colors shadow-xs flex items-center gap-1.5 ${
              isDangerous
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmLabel || defaultConfirm}
          </button>
        </div>
      </div>
    </div>
  );
};
