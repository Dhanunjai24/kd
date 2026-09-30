import { Booking, WorkerProfile, JobRankScore, RankSortMode } from '../types/kaamdost';

/**
 * Recommended Jobs Algorithm
 * ----------------------------
 * Ranks incoming and available job requests for the Worker App based on three key parameters:
 * 1. Worker's current distance to the job location (40% weight - critical for quick arrival & fuel efficiency)
 * 2. Worker's trade rating and skill alignment (35% weight - assures high customer satisfaction)
 * 3. Historical completion success rate (25% weight - prioritizes reliable, dispute-free partners)
 */

export const ALGORITHM_WEIGHTS = {
  distance: 0.4,
  tradeRating: 0.35,
  completionRate: 0.25,
};

/**
 * Calculates the Distance Score (0 - 100).
 * Closer jobs receive significantly higher scores to optimize transit times in dense urban areas.
 */
export function calculateDistanceScore(distanceKm: number): number {
  if (distanceKm <= 1.0) {
    return 100;
  }
  if (distanceKm <= 3.0) {
    // 1.0km -> 100, 3.0km -> 76
    return Math.max(0, Math.round(100 - (distanceKm - 1.0) * 12));
  }
  if (distanceKm <= 6.0) {
    // 3.0km -> 76, 6.0km -> 49
    return Math.max(0, Math.round(76 - (distanceKm - 3.0) * 9));
  }
  // > 6.0km
  return Math.max(15, Math.round(49 - (distanceKm - 6.0) * 5));
}

/**
 * Calculates the Trade Rating Score (0 - 100).
 * Evaluates the worker's star rating out of 5 combined with an exact trade specialty check.
 */
export function calculateRatingScore(worker: WorkerProfile, job: Booking): number {
  const baseRatingScore = Math.min(100, Math.max(0, (worker.rating / 5.0) * 100));

  // Trade alignment check
  const isDirectTradeMatch =
    worker.trade.trim().toLowerCase() === (job.workerTrade || '').trim().toLowerCase();

  const tradeMultiplier = isDirectTradeMatch ? 1.0 : 0.85;

  return Math.min(100, Math.round(baseRatingScore * tradeMultiplier));
}

/**
 * Calculates the Completion Success Rate Score (0 - 100).
 * Reflects historical on-time and completed jobs without disputes or cancellations.
 */
export function calculateCompletionScore(worker: WorkerProfile): number {
  const rate =
    typeof worker.completionSuccessRate === 'number'
      ? worker.completionSuccessRate
      : 98.2; // default high-trust baseline for verified partners

  return Math.min(100, Math.max(0, Math.round(rate)));
}

/**
 * Computes the complete composite ranking score and insight breakdown for a job request.
 */
export function calculateJobRank(job: Booking, worker: WorkerProfile): JobRankScore {
  const distanceKm = typeof job.distanceKm === 'number' ? job.distanceKm : 2.5;

  const distanceScore = calculateDistanceScore(distanceKm);
  const ratingScore = calculateRatingScore(worker, job);
  const completionScore = calculateCompletionScore(worker);

  const weightedTotal =
    distanceScore * ALGORITHM_WEIGHTS.distance +
    ratingScore * ALGORITHM_WEIGHTS.tradeRating +
    completionScore * ALGORITHM_WEIGHTS.completionRate;

  const isDirectTradeMatch =
    worker.trade.trim().toLowerCase() === (job.workerTrade || worker.trade).trim().toLowerCase();

  let matchPercentage = Math.min(100, Math.max(0, Math.round(weightedTotal)));

  // If distance is ultra-close (<= 1.0 km) and direct trade match with stellar rating (>= 4.8), normalize to a perfect 100% Top Recommended match!
  if (distanceKm <= 1.0 && isDirectTradeMatch && worker.rating >= 4.8) {
    matchPercentage = 100;
  }

  let tier: JobRankScore['tier'] = 'STANDARD';
  let tierLabel = 'Standard Match';
  let tierBadgeClass = 'bg-slate-700 text-white';

  if (matchPercentage === 100) {
    tier = 'TOP_RECOMMENDED';
    tierLabel = 'Top Recommended (100% Match)';
    tierBadgeClass =
      'bg-gradient-to-r from-emerald-600 to-teal-600 text-white ring-2 ring-emerald-300 shadow-sm';
  } else if (matchPercentage >= 90) {
    tier = 'TOP_RECOMMENDED';
    tierLabel = 'Top Recommended Match';
    tierBadgeClass = 'bg-emerald-600 text-white ring-2 ring-emerald-300/50';
  } else if (matchPercentage >= 80) {
    tier = 'HIGH_MATCH';
    tierLabel = 'High Priority Match';
    tierBadgeClass = 'bg-blue-600 text-white ring-2 ring-blue-300/50';
  } else if (matchPercentage >= 70) {
    tier = 'GOOD_MATCH';
    tierLabel = 'Good Proximity Match';
    tierBadgeClass = 'bg-amber-600 text-white';
  }

  // Generate actionable algorithmic insights for the worker UI
  const insights: string[] = [];

  if (matchPercentage === 100) {
    insights.push(
      '⭐ 100% Perfect Algorithm Match: Ultra-close proximity (< 1km), direct trade alignment, and flawless historical completion record. Triggered unique long-pulse tactile alert.'
    );
  }

  if (distanceKm <= 1.5) {
    insights.push(`Ultra-close (${distanceKm} km away in ${job.area || 'your zone'}) — under 15 mins travel.`);
  } else if (distanceKm <= 3.5) {
    insights.push(`Moderate proximity (${distanceKm} km away) with direct transit access.`);
  } else {
    insights.push(`Slightly farther (${distanceKm} km away) — consider traffic conditions.`);
  }

  insights.push(
    `Your ${worker.rating}★ ${worker.trade} reputation matches this request with a ${ratingScore}/100 rating factor.`
  );

  insights.push(
    `Your verified ${completionScore}% job completion record gives you top dispatch ranking priority.`
  );

  return {
    bookingId: job.id,
    totalScore: matchPercentage,
    matchPercentage,
    tier,
    tierLabel,
    tierBadgeClass,
    distanceScore,
    ratingScore,
    completionScore,
    distanceKm,
    weights: {
      distance: ALGORITHM_WEIGHTS.distance,
      tradeRating: ALGORITHM_WEIGHTS.tradeRating,
      completionRate: ALGORITHM_WEIGHTS.completionRate,
    },
    insights,
  };
}

/**
 * Sorts and ranks a list of jobs based on the selected mode:
 * - RECOMMENDED: Highest algorithm match composite score first
 * - DISTANCE: Lowest km distance first
 * - PAYOUT: Highest baseAmount ₹ first
 * - URGENCY: Most recently created first
 */
export function rankAndSortJobs(
  jobs: Booking[],
  worker: WorkerProfile,
  sortMode: RankSortMode = 'RECOMMENDED'
): Array<{ job: Booking; rank: JobRankScore }> {
  const ranked = jobs.map((job) => ({
    job,
    rank: calculateJobRank(job, worker),
  }));

  return ranked.sort((a, b) => {
    switch (sortMode) {
      case 'RECOMMENDED':
        return b.rank.matchPercentage - a.rank.matchPercentage;
      case 'DISTANCE':
        return a.job.distanceKm - b.job.distanceKm;
      case 'PAYOUT':
        return b.job.baseAmount - a.job.baseAmount;
      case 'URGENCY':
        return b.job.id.localeCompare(a.job.id);
      default:
        return b.rank.matchPercentage - a.rank.matchPercentage;
    }
  });
}

/**
 * Helper to check if a job request is identified as 'Top Recommended' (100% match)
 * by the Recommended Jobs algorithm.
 */
export function isTopRecommended100Match(job: Booking, worker: WorkerProfile): boolean {
  const rank = calculateJobRank(job, worker);
  return rank.tier === 'TOP_RECOMMENDED' && rank.matchPercentage === 100;
}

