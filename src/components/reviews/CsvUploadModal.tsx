import React, { useState, useRef } from 'react';
import { useStore } from '../../lib/storeContext';
import Papa from 'papaparse';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
} from 'lucide-react';
import { Review } from '../../types';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({ isOpen, onClose }) => {
  const { addReviews, activeStore } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [parsedCount, setParsedCount] = useState<number>(0);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processCsv(e.target.files[0]);
    }
  };

  const processCsv = (uploadedFile: File) => {
    setFile(uploadedFile);
    setErrorMsg('');
    setIsParsing(true);

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsParsing(false);
        const data = results.data as Record<string, string>[];

        if (data.length === 0) {
          setErrorMsg('CSV file is empty.');
          return;
        }

        setParsedCount(data.length);
        setPreviewRows(data.slice(0, 3));
      },
      error: (err) => {
        setIsParsing(false);
        setErrorMsg(`Failed to parse CSV: ${err.message}`);
      },
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCsv(e.dataTransfer.files[0]);
    }
  };

  const handleStartAnalysis = async () => {
    if (!file) return;
    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rawData = results.data as Record<string, string>[];

        const mappedReviews: Partial<Review>[] = rawData.map((row, i) => {
          const keys = Object.keys(row);
          const findKey = (candidates: string[]) => {
            const normKeys = keys.map((k) => ({ original: k, clean: k.trim().toLowerCase() }));
            // 1. Exact match
            for (const c of candidates) {
              const match = normKeys.find((k) => k.clean === c.toLowerCase());
              if (match) return match.original;
            }
            // 2. Starts with match
            for (const c of candidates) {
              const match = normKeys.find((k) => k.clean.startsWith(c.toLowerCase()));
              if (match) return match.original;
            }
            // 3. Substring match
            for (const c of candidates) {
              const match = normKeys.find((k) => k.clean.includes(c.toLowerCase()));
              if (match) return match.original;
            }
            return undefined;
          };

          const textKey = findKey(['review text', 'review_text', 'review text / comment', 'customer review', 'feedback', 'comments', 'comment', 'body', 'content', 'review']);
          const titleKey = findKey(['review title', 'review_title', 'headline', 'title', 'summary', 'subject']);
          const prodKey = findKey(['product name', 'product_name', 'product', 'item name', 'item_name', 'item', 'sku']);
          const ratingKey = findKey(['rating', 'ratings', 'star', 'stars', 'score']);
          const dateKey = findKey(['review date', 'review_date', 'date', 'created_at', 'timestamp']);
          const idKey = findKey(['review id', 'review_id', 'id', 'order id', 'order_id']);

          const rawText = textKey ? row[textKey] : '';
          const textField = rawText && rawText.trim() ? rawText.trim() : 'Customer feedback';
          const titleField = titleKey && row[titleKey] ? row[titleKey].trim() : '';
          const prodField = prodKey && row[prodKey] ? row[prodKey].trim() : `${activeStore.category} Item`;

          let ratingVal = 4;
          if (ratingKey && row[ratingKey]) {
            const rStr = String(row[ratingKey]);
            const digitMatch = rStr.match(/([1-5])/);
            if (digitMatch) {
              ratingVal = parseInt(digitMatch[1], 10);
            } else {
              const parsed = parseFloat(rStr);
              if (!isNaN(parsed)) ratingVal = Math.min(5, Math.max(1, Math.round(parsed)));
            }
          }

          const dateField = (dateKey && row[dateKey] && row[dateKey].trim()) || new Date().toISOString();
          const reviewId = (idKey && row[idKey] && row[idKey].trim()) || `csv-${Date.now()}-${i}`;

          return {
            id: reviewId,
            product_name: prodField,
            product_sku: `SKU-${100 + i}`,
            rating: ratingVal,
            review_title: titleField,
            review_text: textField,
            source_platform: 'Storefront',
            review_date: dateField,
          };
        });

        try {
          await addReviews(mappedReviews, replaceExisting);
        } finally {
          setIsUploading(false);
          onClose();
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-slate-100 text-slate-800 flex items-center justify-center">
              <Upload className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                Import Customer Reviews (CSV)
              </h3>
              <p className="text-[11px] text-slate-500">
                Upload customer review exports or standard CSV spreadsheet
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

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-md p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <div className="w-8 h-8 rounded bg-white shadow-xs border border-slate-200 flex items-center justify-center mx-auto mb-2 text-slate-700">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-medium text-slate-800">
              {file ? file.name : 'Click to select or drag and drop CSV file'}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Supports standard headers (Review Text, Rating, Product Name, Date)
            </p>
          </div>

          {/* Sample Download Links */}
          <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 text-[11.5px]">Need a demo file?</span>
            <a
              href="/samples/sample_reviews.csv"
              download
              className="text-slate-800 hover:text-slate-900 font-medium flex items-center gap-1 hover:underline text-[11.5px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sample Reviews CSV</span>
            </a>
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Preview */}
          {parsedCount > 0 && (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ready to Import: {parsedCount} Reviews Detected</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                Columns verified for store profile: "{activeStore.name}"
              </p>
              <label className="flex items-center gap-2 pt-1 border-t border-emerald-200/60 text-[11px] text-emerald-900 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="rounded border-emerald-300 text-emerald-700 focus:ring-0"
                />
                <span>Replace existing reviews with this import (recommended)</span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-3 py-1.5 rounded text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStartAnalysis}
            disabled={!file || parsedCount === 0 || isParsing || isUploading}
            className="px-3.5 py-1.5 rounded text-xs font-medium bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white flex items-center gap-1.5 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Importing & Analyzing...' : 'Process & Import'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
