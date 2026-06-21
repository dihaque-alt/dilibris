import { supabase } from '../supabase';
import type { Review } from '../../types/database';
import { offlineDb, isOnline, nowIso, type PendingOp } from './db';

export type ReviewWritePayload = {
  body: string;
  rating: number;
  contains_spoilers: boolean;
};

export type ReviewsForBook = {
  reviews: Review[];
  fromCache: boolean;
};

async function enqueue(userId: string, op: Omit<PendingOp, 'id' | 'userId' | 'createdAt'>) {
  await offlineDb.pendingOps.add({
    id: crypto.randomUUID(),
    userId,
    ...op,
    createdAt: Date.now(),
  });
}

async function pendingReviewIds(userId: string): Promise<Set<string>> {
  const ops = await offlineDb.pendingOps.where('userId').equals(userId).toArray();
  return new Set(
    ops
      .filter((op) => op.table === 'reviews')
      .map((op) => (op.payload as { id: string }).id)
      .filter(Boolean),
  );
}

async function cacheBookReviews(userId: string, bookId: string, reviews: Review[]) {
  const keep = await pendingReviewIds(userId);
  const oldIds = await offlineDb.reviews.where('book_id').equals(bookId).primaryKeys();
  const deleteIds = oldIds.filter((id) => !keep.has(id));
  if (deleteIds.length > 0) {
    await offlineDb.reviews.bulkDelete(deleteIds);
  }
  if (reviews.length > 0) {
    await offlineDb.reviews.bulkPut(reviews);
  }
}

async function readCachedBookReviews(bookId: string): Promise<ReviewsForBook> {
  const reviews = await offlineDb.reviews
    .where('book_id')
    .equals(bookId)
    .reverse()
    .sortBy('created_at');
  return { reviews, fromCache: true };
}

export async function fetchReviewsForBook(userId: string, bookId: string): Promise<ReviewsForBook> {
  if (isOnline()) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profile:profiles (display_name, avatar_url)
        `)
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviews = (data as Review[]) ?? [];
      await cacheBookReviews(userId, bookId, reviews);
      return { reviews, fromCache: false };
    } catch {
      const cached = await readCachedBookReviews(bookId);
      if (cached.reviews.length > 0) return cached;
      throw new Error('Offline — немає збережених відгуків. Підключись до інternet хоча б раз.');
    }
  }

  const cached = await readCachedBookReviews(bookId);
  if (cached.reviews.length === 0) {
    throw new Error('Offline — немає збережених відгуків. Підключись до інternet хоча б раз.');
  }
  return cached;
}

export async function refreshUserReviewsCache(userId: string): Promise<void> {
  if (!isOnline()) return;

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const keep = await pendingReviewIds(userId);
  const remoteIds = new Set((data ?? []).map((r) => r.id));
  const localIds = await offlineDb.reviews.where('user_id').equals(userId).primaryKeys();
  const staleLocal = localIds.filter((id) => !remoteIds.has(id) && !keep.has(id));
  if (staleLocal.length > 0) {
    await offlineDb.reviews.bulkDelete(staleLocal);
  }

  if (data?.length) {
    await offlineDb.reviews.bulkPut(data as Review[]);
  }
}

export async function saveReview(
  userId: string,
  entryId: string,
  bookId: string,
  reviewId: string | null,
  payload: ReviewWritePayload,
): Promise<Review> {
  const now = nowIso();
  const id = reviewId ?? crypto.randomUUID();
  const existing = reviewId ? await offlineDb.reviews.get(reviewId) : null;

  const review: Review = {
    id,
    user_id: userId,
    book_id: bookId,
    entry_id: entryId,
    body: payload.body,
    rating: payload.rating,
    contains_spoilers: payload.contains_spoilers,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  await offlineDb.reviews.put(review);

  if (isOnline()) {
    if (reviewId) {
      const { error } = await supabase
        .from('reviews')
        .update({
          body: payload.body,
          rating: payload.rating,
          contains_spoilers: payload.contains_spoilers,
          updated_at: now,
        })
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('reviews').insert(review);
      if (error) throw error;
    }
    return review;
  }

  await enqueue(userId, {
    table: 'reviews',
    operation: reviewId ? 'update' : 'insert',
    payload: (reviewId ? { id, ...payload, updated_at: now } : review) as Record<string, unknown>,
  });

  return review;
}

export async function deleteReview(userId: string, reviewId: string): Promise<void> {
  await offlineDb.reviews.delete(reviewId);

  if (isOnline()) {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId).eq('user_id', userId);
    if (error) throw error;
    return;
  }

  await enqueue(userId, {
    table: 'reviews',
    operation: 'delete',
    payload: { id: reviewId },
  });
}

export async function executeReviewOp(op: PendingOp): Promise<void> {
  if (op.table !== 'reviews') return;

  switch (op.operation) {
    case 'insert': {
      const { error } = await supabase.from('reviews').insert(op.payload);
      if (error) throw error;
      break;
    }
    case 'update': {
      const row = op.payload as Record<string, unknown> & { id: string; updated_at: string };
      const { id, updated_at, ...patch } = row;
      const { data: remote, error: readError } = await supabase
        .from('reviews')
        .select('updated_at')
        .eq('id', id)
        .maybeSingle();
      if (readError) throw readError;
      if (remote && new Date(remote.updated_at) > new Date(updated_at)) {
        return;
      }
      const { error } = await supabase
        .from('reviews')
        .update({ ...patch, updated_at })
        .eq('id', id);
      if (error) throw error;
      break;
    }
    case 'delete': {
      const { id } = op.payload as { id: string };
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      break;
    }
  }
}
