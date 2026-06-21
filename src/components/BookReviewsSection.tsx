import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { formatDateTimeUk } from '../lib/dates';
import { formatStarRating } from '../lib/rating';
import {
  deleteReview,
  fetchReviewsForBook,
  saveReview,
  type ReviewWritePayload,
} from '../lib/offline/reviewsSync';
import type { Review } from '../types/database';
import { useOffline } from './OfflineProvider';
import { StarRating } from './StarRating';

interface BookReviewsSectionProps {
  bookId: string;
  entryId: string;
  userId: string;
  entryRating: number | null;
  embedded?: boolean;
  formId?: string;
  onFormOpenChange?: (open: boolean) => void;
  onSavingChange?: (saving: boolean) => void;
}

function ReviewBody({ body, containsSpoilers }: { body: string; containsSpoilers: boolean }) {
  const [revealed, setRevealed] = useState(!containsSpoilers);

  if (!body.trim()) return null;

  if (!revealed) {
    return (
      <div className="review-spoiler">
        <p className="form-hint">Містить спойлери</p>
        <button type="button" className="dl-ghost" onClick={() => setRevealed(true)}>
          Показати відгук
        </button>
      </div>
    );
  }

  return <p className="review-body">{body}</p>;
}

export function BookReviewsSection({
  bookId,
  entryId,
  userId,
  entryRating,
  embedded,
  formId = 'book-review-form',
  onFormOpenChange,
  onSavingChange,
}: BookReviewsSectionProps) {
  const { refreshPending } = useOffline();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewBody, setReviewBody] = useState('');
  const [containsSpoilers, setContainsSpoilers] = useState(false);

  const ownReview = reviews.find((r) => r.user_id === userId) ?? null;
  const otherReviews = reviews.filter((r) => r.user_id !== userId);

  const loadReviews = useCallback(async () => {
    const { reviews: loaded } = await fetchReviewsForBook(userId, bookId);
    setReviews(loaded);
  }, [bookId, userId]);

  useEffect(() => {
    loadReviews()
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити відгуки');
      })
      .finally(() => setLoading(false));
  }, [loadReviews]);

  useEffect(() => {
    if (ownReview && !editing) {
      setReviewRating(ownReview.rating);
      setReviewBody(ownReview.body);
      setContainsSpoilers(ownReview.contains_spoilers);
    }
  }, [ownReview, editing]);

  useEffect(() => {
    onFormOpenChange?.(editing);
    return () => {
      onFormOpenChange?.(false);
    };
  }, [editing, onFormOpenChange]);

  useEffect(() => {
    onSavingChange?.(saving);
    return () => {
      onSavingChange?.(false);
    };
  }, [saving, onSavingChange]);

  function startEditing() {
    if (ownReview) {
      setReviewRating(ownReview.rating);
      setReviewBody(ownReview.body);
      setContainsSpoilers(ownReview.contains_spoilers);
    } else {
      setReviewRating(entryRating ?? 4);
      setReviewBody('');
      setContainsSpoilers(false);
    }
    setEditing(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const rating = reviewRating;
    if (!rating) {
      setError('Обери оцінку для відгуку');
      return;
    }

    setSaving(true);
    setError('');

    const payload: ReviewWritePayload = {
      body: reviewBody.trim(),
      rating,
      contains_spoilers: containsSpoilers,
    };

    try {
      await saveReview(userId, entryId, bookId, ownReview?.id ?? null, payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти відгук');
      setSaving(false);
      return;
    }

    await loadReviews();
    await refreshPending();
    setEditing(false);
    setSaving(false);
  }

  async function handleDelete() {
    if (!ownReview || !window.confirm('Видалити свій відгук?')) return;
    setError('');

    try {
      await deleteReview(userId, ownReview.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити відгук');
      return;
    }

    setReviewRating(0);
    setReviewBody('');
    setContainsSpoilers(false);
    setEditing(false);
    await loadReviews();
    await refreshPending();
  }

  return (
    <section className={embedded ? 'reviews-section reviews-section--embedded' : 'reviews-section'}>
      {!embedded && (
        <div className="panel-head">
          <h3>Відгуки</h3>
          {!editing && (
            <button type="button" className="dl-ghost" onClick={startEditing}>
              {ownReview ? 'Редагувати' : '+ Написати'}
            </button>
          )}
        </div>
      )}

      {embedded && !editing && (
        <div className="embedded-actions">
          <button type="button" className="dl-ghost" onClick={startEditing}>
            {ownReview ? 'Редагувати відгук' : '+ Написати відгук'}
          </button>
        </div>
      )}

      {!embedded && (
        <p className="form-hint reviews-public-note">Відгуки завжди публічні — їх бачать інші читачі.</p>
      )}

      {loading ? (
        <p className="form-hint">Завантажуємо відгуки…</p>
      ) : editing ? (
        <form id={formId} className="inline-form review-form" onSubmit={handleSave}>
          <div className="dl-field">
            <span className="dl-field-label">Оцінка</span>
            <StarRating value={reviewRating} size={26} onChange={setReviewRating} />
          </div>
          <label>
            Текст відгуку
            <textarea
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              rows={4}
              placeholder="Що сподобалось, що ні… (можна лише зірки)"
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={containsSpoilers}
              onChange={(e) => setContainsSpoilers(e.target.checked)}
            />
            Містить спойлери
          </label>
          <div className={`form-actions${embedded ? ' form-actions--detail' : ''}`}>
            <button
              type="button"
              className="dl-ghost"
              onClick={() => {
                setEditing(false);
                setError('');
              }}
            >
              Скасувати
            </button>
            {ownReview && (
              <button type="button" className="dl-danger" onClick={handleDelete}>
                Видалити
              </button>
            )}
            <button type="submit" className="dl-primary" disabled={saving}>
              {saving ? 'Зберігаємо…' : 'Опублікувати'}
            </button>
          </div>
        </form>
      ) : ownReview ? (
        <article className="review-card review-card--own">
          <header className="review-header">
            <strong>Твій відгук</strong>
            <span className="review-rating">{formatStarRating(ownReview.rating)}</span>
          </header>
          <ReviewBody body={ownReview.body} containsSpoilers={ownReview.contains_spoilers} />
          <time className="review-date">{formatDateTimeUk(ownReview.updated_at)}</time>
        </article>
      ) : (
        <p className="empty-hint">Ще немає твого відгуку. Поділись враженнями — інші читачі побачать його тут.</p>
      )}

      {otherReviews.length > 0 && (
        <>
          <h4 className="reviews-others-title">Інші читачі ({otherReviews.length})</h4>
          <ul className="review-list">
            {otherReviews.map((review) => (
              <li key={review.id}>
                <article className="review-card">
                  <header className="review-header">
                    <strong>{review.profile?.display_name || 'Читач'}</strong>
                    <span className="review-rating">{formatStarRating(review.rating)}</span>
                  </header>
                  <ReviewBody body={review.body} containsSpoilers={review.contains_spoilers} />
                  <time className="review-date">{formatDateTimeUk(review.created_at)}</time>
                </article>
              </li>
            ))}
          </ul>
        </>
      )}

      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
