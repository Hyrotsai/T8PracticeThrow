import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export const RANKING_COLLECTION = 'Ranking';

export interface RankingEntry {
  id: string;
  nick: string;
  score: number;          // consecutive correct breaks (streak at first fail)
  timestamp: number;      // epoch ms
  config: RankingConfig;
}

export interface RankingConfig {
  speed: number;          // must be 1.0
  breakWindow: number;    // must be 20 frames
  frameStart: number;     // must be 42
}

/** Default config required to participate */
export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  speed: 1,
  breakWindow: 20,
  frameStart: 42,
};

/** Fetch top 10 entries ordered by score desc */
export async function getTopTen(): Promise<RankingEntry[]> {
  const q = query(
    collection(db, RANKING_COLLECTION),
    orderBy('score', 'desc'),
    limit(10),
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      nick: d.nick ?? '',
      score: d.score ?? 0,
      timestamp: d.timestamp?.toMillis?.() ?? 0,
      config: d.config ?? DEFAULT_RANKING_CONFIG,
    };
  });
}

/**
 * Submit a score for a nick.
 * - If nick already exists → update only if new score is higher.
 * - If nick is new → create a new document with random ID.
 * Returns 'created' | 'updated' | 'ignored' (existing score was higher).
 */
export async function submitScore(
  nick: string,
  score: number,
): Promise<'created' | 'updated' | 'ignored'> {
  const trimmedNick = nick.trim();

  // Check if nick already exists
  const q = query(
    collection(db, RANKING_COLLECTION),
    where('nick', '==', trimmedNick),
    limit(1),
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    const existing = snap.docs[0];
    const existingScore: number = existing.data().score ?? 0;
    if (score > existingScore) {
      await updateDoc(existing.ref, {
        score,
        timestamp: serverTimestamp(),
        config: DEFAULT_RANKING_CONFIG,
      });
      return 'updated';
    }
    return 'ignored';
  }

  // New nick → create document
  await addDoc(collection(db, RANKING_COLLECTION), {
    nick: trimmedNick,
    score,
    timestamp: serverTimestamp(),
    config: DEFAULT_RANKING_CONFIG,
  });
  return 'created';
}
