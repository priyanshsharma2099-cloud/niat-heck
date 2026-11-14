import React, { useState } from 'react';
import { useStore } from '../../lib/storeContext';
import {
  X,
  FlaskConical,
  Sparkles,
  Zap,
  Star,
  Send,
  PlusCircle,
} from 'lucide-react';
import { Review, ReviewSource } from '../../types';

interface ReviewSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewSimulatorModal: React.FC<ReviewSimulatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addReviews, activeStore } = useStore();
  const [productName, setProductName] = useState('Core Everyday Crewneck');
  const [rating, setRating] = useState<number>(2);
  const [reviewTitle, setReviewTitle] = useState('Armhole is painfully tight');
  const [reviewText, setReviewText] = useState(
    'Love the color and weave, but the armhole and shoulder cut on XL has zero ease. Cannot lift my arms. Please add at least 1.5 inches to your pattern.'
  );
  const [platform, setPlatform] = useState<ReviewSource>('Storefront');

  if (!isOpen) return null;

  const handleSimulateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    const singleReview: Partial<Review> = {
      id: `sim-${Date.now()}`,
      product_name: productName.trim(),
      product_sku: 'SIM-SKU-99',
      rating,
      review_title: reviewTitle.trim(),
      review_text: reviewText.trim(),
      source_platform: platform,
      review_date: new Date().toISOString(),
    };

    onClose();
    await addReviews([singleReview]);
  };

  const handleBatchInject = async (scenario: 'mixed' | 'sizing_spike' | 'logistics_noise') => {
    let mockBatch: Partial<Review>[] = [];

    if (scenario === 'sizing_spike') {
      mockBatch = [
        {
          id: `spike-1-${Date.now()}`,
          product_name: 'Cotton Blend Top',
          rating: 1,
          review_title: 'Sizing completely off',
          review_text: 'Bought size L based on your measurements, but the bust measurement is 3 inches smaller than listed on your chart!',
          source_platform: 'Storefront',
        },
        {
          id: `spike-2-${Date.now()}`,
          product_name: 'Cotton Blend Top',
          rating: 2,
          review_title: 'Armhole stitching constricting',
          review_text: 'The sleeve opening has no room for movement. Stitching feels like it will snap if I stretch.',
          source_platform: 'Marketplace',
        },
      ];
    } else if (scenario === 'logistics_noise') {
      mockBatch = [
        {
          id: `noise-1-${Date.now()}`,
          product_name: 'Standard Package',
          rating: 1,
          review_title: 'Delivery was 4 days late',
          review_text: 'The courier delivery driver marked customer unavailable without calling. Product is good though.',
          source_platform: 'Storefront',
        },
        {
          id: `noise-2-${Date.now()}`,
          product_name: 'Standard Package',
          rating: 2,
          review_title: 'Outer box smashed flat',
          review_text: 'The delivery van must have piled heavy boxes on top. The outer carton was crushed.',
          source_platform: 'Marketplace',
        },
      ];
    } else {
      mockBatch = [
        {
          id: `mix-1-${Date.now()}`,
          product_name: 'Everyday Linen Shirt',
          rating: 5,
          review_title: 'Clean minimal cut',
          review_text: 'Great quality and clean finish. Fabric has a natural breathable drape.',
          source_platform: 'Storefront',
        },
        {
          id: `mix-2-${Date.now()}`,
          product_name: 'Everyday Linen Shirt',
          rating: 1,
          review_title: 'Color ran in cold soak',
          review_text: 'Washed in normal cold water and color bled into the white collar trim.',
          source_platform: 'Marketplace',
        },
        {
          id: `mix-3-${Date.now()}`,
          product_name: 'Everyday Linen Shirt',
          rating: 2,
          review_title: 'Courier dumped parcel outside',
          review_text: 'Delivery partner left the package outside in the heat. Product inside was intact.',
          source_platform: 'Direct',
        },
      ];
    }

    onClose();
    await addReviews(mockBatch);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-slate-100 text-slate-800 flex items-center justify-center">
              <FlaskConical className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                Sample Review Generator
              </h3>
              <p className="text-[11px] text-slate-500">
                Inject test feedback scenarios to evaluate category sentiment
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

        {/* Content */}
        <div className="p-4 space-y-3.5">
          {/* Quick Scenario Injectors */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
              Quick Test Batches
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleBatchInject('sizing_spike')}
                className="p-2.5 rounded-md border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-left transition-all"
              >
                <div className="flex items-center gap-1 font-semibold text-xs text-rose-800">
                  <Zap className="w-3 h-3 text-rose-600" />
                  <span>Sizing Surge</span>
                </div>
                <p className="text-[10.5px] text-rose-600 mt-0.5 leading-snug">
                  Adds 2 sizing complaints
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleBatchInject('logistics_noise')}
                className="p-2.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-all"
              >
                <div className="flex items-center gap-1 font-semibold text-xs text-slate-800">
                  <Zap className="w-3 h-3 text-slate-600" />
                  <span>Shipping Delay</span>
                </div>
                <p className="text-[10.5px] text-slate-500 mt-0.5 leading-snug">
                  Adds 2 courier reviews
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleBatchInject('mixed')}
                className="p-2.5 rounded-md border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-left transition-all"
              >
                <div className="flex items-center gap-1 font-semibold text-xs text-blue-800">
                  <PlusCircle className="w-3 h-3 text-blue-600" />
                  <span>Balanced Mix</span>
                </div>
                <p className="text-[10.5px] text-blue-600 mt-0.5 leading-snug">
                  Praise, dye, delivery
                </p>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-semibold uppercase">
              Or compose single review
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Custom Single Review Form */}
          <form onSubmit={handleSimulateSingle} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Star Rating (1 - 5)
                </label>
                <div className="flex items-center gap-1 pt-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      className="p-0.5 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          starVal <= rating ? 'fill-current' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-1.5 font-semibold text-slate-700 text-xs">{rating} Stars</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Review Headline
              </label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Review Text Body
              </label>
              <textarea
                required
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 text-xs leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Add Review to Dataset</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
