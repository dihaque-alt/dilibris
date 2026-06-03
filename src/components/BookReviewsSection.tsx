import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { formatDateTimeUk } from '../lib/dates';
import { formatStarRating, parseRating, REVIEW_RATING_OPTIONS } from '../lib/rating';
import type { Review } from '../types/database';

interface BookReviewsSectionProps {
  bookId: string;
  entryId: string;
  userId: string;
  entryRating: number | null;
  embedded?: boolean;
}

function ReviewBody({ body, containsSpoilers }: { body: string; containsSpoilers: boolean }) {
  const [revealed, setRevealed] = useState(!containsSpoilers);

  if (!body.trim()) return null;

  if (!revealed) {
    return (
      <div className="review-spoiler">
        <p className="form-hint">Містить спойлери</p>
        <button type="button" className="btn-small btn-secondary" onClick={() => setRevealed(true)}>
          Показати відгук
        </button>
      </div>
    );
  }

  return <p className="review-body">{body}</p>;
}

export function BookReviewsSection({ bookId, entryId, userId, entryRating, embedded }: BookReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [reviewRating, setReviewRating] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [containsSpoilers, setContainsSpoilers] = useState(false);

  const ownReview = reviews.find((r) => r.user_id === userId) ?? null;
  const otherReviews = reviews.filter((r) => r.user_id !== userId);

  const loadReviews = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('reviews')
      .select(`
        *,
        profile:profiles (display_name, avatar_url)
      `)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;
    setReviews((data as Review[]) ?? []);
  }, [bookId]);

  useEffect(() => {
    loadReviews()
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити відгуки');
      })
      .finally(() => setLoading(false));
  }, [loadReviews]);

  useEffect(() => {
    if (ownReview && !editing) {
      setReviewRating(String(ownReview.rating));
      setReviewBody(ownReview.body);
      setContainsSpoilers(ownReview.contains_spoilers);
    }
  }, [ownReview, editing]);

  function startEditing() {
    if (ownReview) {
      setReviewRating(String(ownReview.rating));
      setReviewBody(ownReview.body);
      setContainsSpoilers(ownReview.contains_spoilers);
    } else {
      setReviewRating(entryRating ? String(entryRating) : '4');
      setReviewBody('');
      setContainsSpoilers(false);
    }
    setEditing(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const rating = parseRating(reviewRating);
    if (!rating) {
      setError('Обери оцінку для відгуку');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      user_id: userId,
      book_id: bookId,
      entry_id: entryId,
      body: reviewBody.trim(),
      rating,
      contains_spoilers: containsSpoilers,
    };

    const { error: upsertError } = ownReview
      ? await supabase.from('reviews').update(payload).eq('id', ownReview.id)
      : await supabase.from('reviews').insert(payload);

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    await loadReviews();
    setEditing(false);
    setSaving(false);
  }

  async function handleDelete() {
    if (!ownReview || !window.confirm('Видалити свій відгук?')) return;
    setError('');

    const { error: deleteError } = await supabase.from('reviews').delete().eq('id', ownReview.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setReviewRating('');
    setReviewBody('');
    setContainsSpoilers(false);
    setEditing(false);
    await loadReviews();
  }

  return (
    <section className={embedded ? 'reviews-section reviews-section--embedded' : 'reviews-section'}>
      {!embedded && (
        <div className="panel-head">
          <h3>Відгуки</h3>
          {!editing && (
            <button type="button" className="btn-small" onClick={startEditing}>
              {ownReview ? 'Редагувати' : '+ Написати'}
            </button>
          )}
        </div>
      )}

      {embedded && !editing && (
        <div className="embedded-actions">
          <button type="button" className="btn-small" onClick={startEditing}>
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
        <form className="inline-form review-form" onSubmit={handleSave}>
          <label>
            Оцінка
            <select value={reviewRating} onChange={(e) => setReviewRating(e.target.value)} required>
              {REVIEW_RATING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
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
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEditing(false);
                setError('');
              }}
            >
              Скасувати
            </button>
            {ownReview && (
              <button type="button" className="btn-danger" onClick={handleDelete}>
                Видалити
              </button>
            )}
            <button type="submit" disabled={saving}>
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
