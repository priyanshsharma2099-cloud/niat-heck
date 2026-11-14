import React, { useState, useEffect } from 'react';
import { useStore } from '../../lib/storeContext';
import { Review } from '../../types';
import { draftPublicCustomerReply } from '../../lib/geminiService';
import {
  X,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  Star,
} from 'lucide-react';

interface ReplyDraftModalProps {
  review: Review | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReplyDraftModal: React.FC<ReplyDraftModalProps> = ({ review, isOpen, onClose }) => {
  const { activeStore } = useStore();
  const [draftedText, setDraftedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTone, setSelectedTone] = useState(activeStore.brand_tone);

  const generateReply = async (toneToUse?: string) => {
    if (!review) return;
    setIsLoading(true);
    try {
      const text = await draftPublicCustomerReply(activeStore, review, toneToUse || selectedTone);
      setDraftedText(text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && review) {
      setCopied(false);
      setSelectedTone(activeStore.brand_tone);
      generateReply(activeStore.brand_tone);
    }
  }, [isOpen, review]);

  if (!isOpen || !review) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(draftedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-slate-100 text-slate-800 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                Customer Response Draft
              </h3>
              <p className="text-[11px] text-slate-500">
                Suggested reply for verified customer feedback
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Original Review Context */}
        <div className="p-4 space-y-3">
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-800">{review.product_name}</span>
                <span className="text-slate-400 text-[10px]">({review.source_platform})</span>
              </div>
              <div className="flex text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < review.rating ? 'fill-current' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-slate-600 italic">"{review.review_text}"</p>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Response Tone
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                'Empathetic & Solution-first',
                'Professional & Direct',
                'Warm & Personal',
              ].map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => {
                    setSelectedTone(tone);
                    generateReply(tone);
                  }}
                  className={`px-2.5 py-1.5 rounded text-[11px] font-medium border transition-all text-center ${
                    selectedTone === tone
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tone.split('&')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Drafted Output */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-700">
                Response Draft
              </label>
              <button
                onClick={() => generateReply()}
                disabled={isLoading}
                className="text-[11px] text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                value={draftedText}
                onChange={(e) => setDraftedText(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-md border border-slate-200 bg-white text-xs leading-relaxed text-slate-800 focus:outline-none focus:border-slate-400"
                placeholder={isLoading ? 'Generating reply...' : ''}
              />
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-md">
                  <div className="flex items-center gap-2 text-slate-700 text-xs font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Drafting response...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Copy and paste into your customer support thread
          </span>
          <button
            onClick={handleCopy}
            disabled={!draftedText || isLoading}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Reply</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
