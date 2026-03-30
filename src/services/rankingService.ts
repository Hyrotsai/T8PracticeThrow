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

export type RankingMode = 'p1' | 'p2' | 'mixed';

export interface RankingEntry {
  id: string;
  nick: string;
  score: number;          // consecutive correct breaks (streak at first fail)
  timestamp: number;      // epoch ms
  config: RankingConfig;
  mode: RankingMode;
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

/** Fetch top 10 entries for a given mode, ordered by score desc */
export async function getTopTen(mode: RankingMode = 'mixed'): Promise<RankingEntry[]> {
  // We fetch more than 10 to account for documents belonging to other modes,
  // then filter in client. This avoids requiring a Firestore composite index
  // (where + orderBy on different fields).
  const q = query(
    collection(db, RANKING_COLLECTION),
    orderBy('score', 'desc'),
    limit(200),
  );
  const snap = await getDocs(q);
  const all = snap.docs.map((doc) => {
    const d = doc.data();
    // Legacy documents without a mode field are treated as 'mixed'
    const docMode: RankingMode = d.mode ?? 'mixed';
    return {
      id: doc.id,
      nick: d.nick ?? '',
      score: d.score ?? 0,
      timestamp: d.timestamp?.toMillis?.() ?? 0,
      config: d.config ?? DEFAULT_RANKING_CONFIG,
      mode: docMode,
    };
  });
  return all.filter((e) => e.mode === mode).slice(0, 10);
}

/**
 * Submit a score for a nick + mode combination.
 * - If nick+mode already exists → update only if new score is higher.
 * - If nick+mode is new → create a new document with random ID.
 * Returns 'created' | 'updated' | 'ignored' (existing score was higher).
 */
export async function submitScore(
  nick: string,
  score: number,
  mode: RankingMode = 'mixed',
): Promise<'created' | 'updated' | 'ignored'> {
  const trimmedNick = nick.trim();

  // Check if nick+mode already exists
  const q = query(
    collection(db, RANKING_COLLECTION),
    where('nick', '==', trimmedNick),
    where('mode', '==', mode),
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
        mode,
      });
      return 'updated';
    }
    return 'ignored';
  }

  // New nick+mode → create document
  await addDoc(collection(db, RANKING_COLLECTION), {
    nick: trimmedNick,
    score,
    timestamp: serverTimestamp(),
    config: DEFAULT_RANKING_CONFIG,
    mode,
  });
  return 'created';
}
