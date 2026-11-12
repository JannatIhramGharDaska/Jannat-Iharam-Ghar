'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Star, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';

type ReviewInfo = {
  productName: string;
  customerName: string;
};

export default function ReviewPage() {
  const params = useParams();
  const token = String(params.token || '');

  const [info, setInfo] = useState<ReviewInfo | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid review link.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadReview() {
      try {
        const response = await fetch(
          `/api/reviews/submit?token=${encodeURIComponent(token)}`,
          { cache: 'no-store' }
        );
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setError(data.error || 'Invalid review link.');
          return;
        }
        setInfo(data);
      } catch {
        if (!cancelled) setError('Could not load review information.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReview();
    return () => { cancelled = true; };
  }, [token]);

  async function submitReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!info || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, comment: comment.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Could not submit review.');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const panel = 'rounded-2xl border border-[#b99549]/30 bg-[#111111] p-6 sm:p-9 shadow-[0_20px_70px_rgba(0,0,0,0.5)]';

  if (loading) {
    return (
      <main className="min-h-[75vh] bg-[#080808] px-4 py-16 text-[#e9ddc4]">
        <div className={`mx-auto max-w-xl ${panel} text-center`}>
          <div className="mx-auto mb-5 h-9 w-9 animate-spin rounded-full border-2 border-[#b99549]/30 border-t-[#e9c875]" />
          <p>Loading review form...</p>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-[75vh] bg-[#080808] px-4 py-16 text-[#f5e9d0]">
        <div className={`mx-auto max-w-xl ${panel} space-y-5 text-center`}>
          <CheckCircle2 className="mx-auto h-16 w-16 text-[#e9c875]" />
          <h1 className="text-3xl font-bold text-[#f3d58c]">Thank You! ❤️</h1>
          <p className="leading-7 text-[#cfc5b1]">Your review has been submitted successfully. It will appear after admin approval.</p>
          <a href="/" className="inline-flex items-center gap-2 rounded-lg border border-[#d7b56b] px-5 py-3 font-semibold text-[#f3d58c] transition hover:bg-[#d7b56b] hover:text-black">
            <ArrowLeft size={17} /> Back to Home
          </a>
        </div>
      </main>
    );
  }

  if (!info) {
    return (
      <main className="min-h-[75vh] bg-[#080808] px-4 py-16 text-[#f5e9d0]">
        <div className={`mx-auto max-w-xl ${panel} space-y-4 text-center`}>
          <h1 className="text-2xl font-bold text-[#f3d58c]">Review Unavailable</h1>
          <p className="text-red-300">{error || 'This review link is invalid or expired.'}</p>
          <a href="/" className="inline-flex items-center gap-2 text-[#e9c875] underline underline-offset-4"><ArrowLeft size={16} /> Back to Home</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[75vh] bg-[#080808] px-4 py-12 sm:py-16 text-[#f5e9d0]">
      <div className="mx-auto max-w-xl">
        <div className="mb-7 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a65c]">Jannat Ihram Ghar</p>
          <h1 className="text-3xl font-bold text-[#f3d58c] sm:text-4xl">Rate Your Purchase</h1>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[#e6c577] to-transparent" />
        </div>

        <div className={`${panel} space-y-6`}>
          <div className="space-y-3 border-b border-[#b99549]/25 pb-6">
            <p className="text-[#d2c5ab]">Thank you, <span className="font-semibold text-[#f5e9d0]">{info.customerName}</span>!</p>
            <h2 className="text-xl font-bold text-[#f3d58c]">{info.productName}</h2>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-[#e5c47c]"><ShieldCheck size={17} /> Verified Purchase</p>
          </div>

          <form onSubmit={submitReview} className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-semibold text-[#f2dfb7]">Your Rating</label>
              <div className="flex gap-2" role="group" aria-label="Choose star rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} stars`}
                    aria-pressed={rating === star}
                    className="rounded-md p-1 transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f3d58c]"
                  >
                    <Star className={`h-9 w-9 sm:h-10 sm:w-10 ${star <= rating ? 'fill-[#e9c875] text-[#e9c875]' : 'text-[#625942]'}`} />
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#a99b80]">{rating} out of 5 stars</p>
            </div>

            <div>
              <label htmlFor="review-comment" className="mb-2 block text-sm font-semibold text-[#f2dfb7]">Your Review</label>
              <textarea
                id="review-comment"
                required
                minLength={10}
                maxLength={1000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your experience..."
                rows={5}
                className="w-full resize-y rounded-xl border border-[#b99549]/40 bg-[#1b1b1b] p-4 text-sm text-[#f5e9d0] placeholder:text-[#8b806d] outline-none transition focus:border-[#e9c875] focus:ring-1 focus:ring-[#e9c875]"
              />
              <p className="mt-1 text-right text-xs text-[#a99b80]">{comment.length}/1000 characters</p>
            </div>

            {error && <p role="alert" className="rounded-lg border border-red-800/60 bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#b78a3d] via-[#f2d78d] to-[#bd9144] py-3.5 font-bold text-[#16110a] shadow-lg shadow-[#b78a3d]/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <p className="text-center text-xs text-[#a99b80]">Reviews are published after admin approval.</p>
          </form>
        </div>
      </div>
    </main>
  );
}
