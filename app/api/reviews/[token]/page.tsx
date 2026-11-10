
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Star } from 'lucide-react';

type ReviewInfo = {
  productName: string;
  customerName: string;
  alreadyReviewed?: boolean;
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
    if (!token) return;

    let cancelled = false;

    async function loadReview() {
      try {
        const response = await fetch(
          `/api/reviews/submit?token=${encodeURIComponent(token)}`
        );

        const data = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          setError(data.error || 'Invalid review link.');
          return;
        }

        setInfo(data);
      } catch {
        if (!cancelled) {
          setError('Could not load review information.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReview();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();

    if (!info || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          rating,
          comment: comment.trim(),
        }),
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

  if (loading) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <p>Loading review form...</p>
      </main>
    );
  }

  if (success) {
    return (
      <main className="max-w-xl mx-auto p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-emerald-900">
          Thank You! ❤️
        </h1>
        <p>
          Your review has been submitted successfully.
          It will appear after admin approval.
        </p>
        <a href="/" className="text-emerald-800 underline">
          Back to Home
        </a>
      </main>
    );
  }

  if (!info) {
    return (
      <main className="max-w-xl mx-auto p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">Review Unavailable</h1>
        <p className="text-red-600">
          {error || 'This review link is invalid or expired.'}
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <div className="bg-white border rounded-xl p-6 space-y-5">
        <h1 className="text-2xl font-bold text-emerald-950">
          Rate Your Purchase
        </h1>

        <p className="text-gray-600">
          Thank you, {info.customerName}!
        </p>

        <h2 className="font-semibold text-lg">
          {info.productName}
        </h2>

        <p className="text-sm text-emerald-800">
          Verified Purchase
        </p>

        <form onSubmit={submitReview} className="space-y-5">
          <div>
            <label className="block font-semibold mb-2">
              Your Rating
            </label>

            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    className={`w-9 h-9 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="review-comment"
              className="block font-semibold mb-2"
            >
              Your Review
            </label>

            <textarea
              id="review-comment"
              required
              minLength={10}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              rows={5}
              className="w-full border rounded-lg p-3"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-900 text-white font-bold rounded-lg py-3 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </main>
  );
}
