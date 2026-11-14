import React, { useState } from 'react';
import Papa from 'papaparse';
import { useStore } from '../../lib/storeContext';
import { Review } from '../../types';
import {
  UploadCloud,
  FileSpreadsheet,
  Sparkles,
  Plus,
  Loader2,
  Check,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const ImportSimulateView: React.FC = () => {
  const {
    activeStore,
    addReviews,
    simulateBatch,
    isAnalyzing,
    setActiveTab,
  } = useStore();

  const [activeImportTab, setActiveImportTab] = useState<'csv' | 'manual' | 'simulate'>('csv');

  // CSV State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Manual Review State
  const [author, setAuthor] = useState('');
  const [productName, setProductName] = useState(`${activeStore.category} Core Item`);
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [manualPlatform, setManualPlatform] = useState(activeStore.platform);

  // 1-Click Sample CSV data
  const handleLoadSampleCsv = () => {
    const sampleCsvString = `author,product_name,rating,review_text,platform
Priya Sharma,Raw Linen Oversized Tunic,5,"The drape and fabric feel effortless all day. Truly genuine quality, already ordered two more colors!",Shopify
Rohit Verma,Raw Linen Oversized Tunic,2,"Love the cloth texture, but the armhole and shoulder cut on size L is way too tight. Need at least 1.5 inches extra ease.",Shopify
Ananya Sen,Raw Linen Oversized Tunic,1,"Delivery courier threw parcel over the gate in the rain. Packaging was completely drenched. Garment inside was saved by the inner polybag.",Shopify
Meera Patel,Raw Linen Oversized Tunic,2,"Sizing chart is misleading. Ordered size M based on measurements, but the sleeve opening pinches painfully when lifting arms.",Shopify
Kabir Das,Raw Linen Oversized Tunic,4,"Authentic weave texture and fast dispatch. Fits well and holds shape nicely after cold water wash.",Shopify
Sneha Roy,Raw Linen Oversized Tunic,1,"Washed as instructed and color bled onto the collar trim. Needs better dye fixing before dispatch.",Shopify`;

    Papa.parse(sampleCsvString, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedRows(results.data);
        setCsvError(null);
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setCsvError('Uploaded CSV file contained no records.');
          return;
        }
        setParsedRows(results.data);
        setCsvError(null);
      },
      error: (err) => {
        setCsvError(`Failed to parse CSV: ${err.message}`);
      },
    });
  };

  const handleIngestParsedCsv = async () => {
    if (parsedRows.length === 0) return;

    // Normalize field mapping
    const normalized: Partial<Review>[] = parsedRows.map((row) => {
      const rawText =
        row.review_text ||
        row.body ||
        row.comment ||
        row.feedback ||
        row.text ||
        row.Review ||
        '';

      const numRating = Number(row.rating || row.stars || row.Rating || 3);

      return {
        author: row.author || row.customer_name || row.Name || 'Anonymous Shopper',
        product_name: row.product_name || row.product || row.item || `${activeStore.category} Item`,
        rating: isNaN(numRating) ? 3 : Math.min(5, Math.max(1, numRating)),
        raw_text: rawText,
        source_platform: row.platform || row.source || activeStore.platform,
      };
    });

    await addReviews(normalized);
    setParsedRows([]);
    setCsvFile(null);
    setActiveTab('overview');
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    await addReviews([
      {
        author: author.trim() || 'Verified Customer',
        product_name: productName.trim() || `${activeStore.category} Item`,
        rating,
        raw_text: reviewText.trim(),
        source_platform: manualPlatform,
      },
    ]);

    setAuthor('');
    setReviewText('');
    setActiveTab('overview');
  };

  return (
    <div className="space-y-6">
      {/* Header & Tab Switcher */}
      <div className="bg-white rounded-[24px] p-6 border border-[#18181B12] shadow-2xs space-y-4">
        <div>
          <h2 className="font-plus-jakarta font-bold text-base text-zinc-900">
            Ingest Feedback & Run Gemini AI
          </h2>
          <p className="text-xs text-zinc-400">
            Import customer reviews via CSV file, single feedback entry, or simulate a 6-review batch
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
          <button
            onClick={() => setActiveImportTab('csv')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeImportTab === 'csv'
                ? 'bg-[#18181B] text-white shadow-xs'
                : 'bg-[#F8F8F5] text-zinc-600 hover:bg-zinc-200/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV File Import</span>
          </button>

          <button
            onClick={() => setActiveImportTab('manual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeImportTab === 'manual'
                ? 'bg-[#18181B] text-white shadow-xs'
                : 'bg-[#F8F8F5] text-zinc-600 hover:bg-zinc-200/60'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Single Review Entry</span>
          </button>

          <button
            onClick={() => setActiveImportTab('simulate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeImportTab === 'simulate'
                ? 'bg-[#18181B] text-white shadow-xs'
                : 'bg-[#F8F8F5] text-zinc-600 hover:bg-zinc-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3B5BDB]" />
            <span>Persona Simulator</span>
          </button>
        </div>
      </div>

      {/* Tab 1: CSV File Upload */}
      {activeImportTab === 'csv' && (
        <div className="bg-white rounded-[24px] p-6 border border-[#18181B12] shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-900">Upload Reviews CSV</h3>
            <button
              onClick={handleLoadSampleCsv}
              className="text-xs font-semibold text-[#3B5BDB] hover:underline"
            >
              1-Click Load Sample CSV
            </button>
          </div>

          {/* Drag & Drop Zone */}
          <label className="border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-[20px] p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#F8F8F5]">
            <UploadCloud className="w-8 h-8 text-zinc-400 mb-2" />
            <p className="text-xs font-semibold text-zinc-700">
              {csvFile ? csvFile.name : 'Click to select or drag and drop your CSV'}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">
              Supports Shopify, Meesho, Amazon, or custom export CSV files
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {csvError && (
            <div className="p-3 rounded-[12px] bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{csvError}</span>
            </div>
          )}

          {/* Preview of Parsed Rows */}
          {parsedRows.length > 0 && (
            <div className="space-y-4 pt-3 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800">
                  Detected {parsedRows.length} reviews ready for ingestion:
                </span>
                <button
                  onClick={handleIngestParsedCsv}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-[14px] bg-[#18181B] hover:bg-black text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                  )}
                  <span>Ingest & Run Gemini Analysis</span>
                </button>
              </div>

              <div className="max-h-60 overflow-auto rounded-[16px] border border-zinc-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F8F5] text-zinc-600 font-mono text-[10px] uppercase border-b border-zinc-200">
                    <tr>
                      <th className="p-2.5">Author</th>
                      <th className="p-2.5">Rating</th>
                      <th className="p-2.5">Review Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {parsedRows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-zinc-50">
                        <td className="p-2.5 font-medium text-zinc-800">{row.author || row.Name || 'Shopper'}</td>
                        <td className="p-2.5 font-mono">{row.rating || row.Rating || '3'} ★</td>
                        <td className="p-2.5 text-zinc-600 max-w-md truncate">
                          {row.review_text || row.body || row.comment || row.text || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Manual Single Review Form */}
      {activeImportTab === 'manual' && (
        <form
          onSubmit={handleManualSubmit}
          className="bg-white rounded-[24px] p-6 border border-[#18181B12] shadow-2xs space-y-4"
        >
          <h3 className="font-bold text-sm text-zinc-900">Enter Single Customer Feedback</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-zinc-700 mb-1">Customer / Author Name</label>
              <input
                type="text"
                placeholder="e.g. Ananya Sen"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none focus:border-zinc-400 font-sans"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">Product Name</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none focus:border-zinc-400 font-sans"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">Star Rating (1 - 5)</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none font-sans"
              >
                <option value={5}>5 Stars (Praise)</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars (Neutral)</option>
                <option value={2}>2 Stars (Critical)</option>
                <option value={1}>1 Star (Severe Defect)</option>
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-medium text-zinc-700 mb-1">Feedback / Review Text *</label>
            <textarea
              rows={4}
              required
              placeholder="e.g. Drape was wonderful but armhole seam tore during the first gentle hand wash..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full p-2.5 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none focus:border-zinc-400 font-sans leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[14px] bg-[#18181B] hover:bg-black text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {isAnalyzing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              )}
              <span>Ingest & Analyze Review</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Simulator Card */}
      {activeImportTab === 'simulate' && (
        <div className="bg-white rounded-[24px] p-6 border border-[#18181B12] shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-zinc-900">
              Simulate 6 Persona-Matched Reviews
            </h3>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Calls Gemini AI to synthesize realistic customer reviews matched to your store's
              niche ({activeStore.category}). Generates genuine praise, courier transit noise, and a
              clustered defect to demonstrate automatic noise filtering and action item synthesis.
            </p>
          </div>

          <div className="p-4 rounded-[16px] bg-[#F8F8F5] border border-zinc-200/80 text-xs space-y-2">
            <span className="font-bold text-zinc-800">What will be generated:</span>
            <ul className="list-disc list-inside space-y-1 text-zinc-600">
              <li>2 High-praise reviews celebrating handloom craftsmanship & breathability</li>
              <li>1 Courier delivery complaint (auto-filtered out as noise)</li>
              <li>3 Sizing & armhole tightness defect reviews (triggering a Spike Surge Alert)</li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              onClick={async () => {
                await simulateBatch();
                setActiveTab('overview');
              }}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[14px] bg-[#3B5BDB] hover:bg-[#324ec7] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-indigo-200" />
              )}
              <span>Run Persona Batch Simulation</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
