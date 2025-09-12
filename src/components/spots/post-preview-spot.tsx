import { motion } from 'framer-motion';
import { formatPrice, formatDuration } from '@/types/spots';
import { cn } from '@/lib/utils';
import spotsConfig from '@/config/spots.json';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Repeat2 } from 'lucide-react';

interface PostPreviewSpotProps {
  id: string;
  className?: string;
  content: string;
  scores?: {
    engagement: number;
    friendliness: number;
    virality: number;
  };
}

export function PostPreviewSpot({ id, content, scores, className }: PostPreviewSpotProps) {
  const spot = spotsConfig.spots.find(s => s.id === id);
  if (!spot) return null;

  const url = spot.available ? spot.stripeUrl : spot.data.url;

  // Deterministic pseudo-random helpers to avoid hydration mismatches
  const hashStringToNumber = (input: string): number => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const chr = input.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  const deterministicMultiplier = (seed: number): number => {
    const x = Math.sin(seed) * 10000;
    const frac = x - Math.floor(x);
    // Map to [0.9, 1.1]
    return 0.9 + frac * 0.2;
  };

  // Calculate engagement metrics
  const calculateMetrics = () => {
    if (!scores) return { replies: 0, reposts: 0, likes: 0, views: 0 };

    // Convert percentage scores to multipliers (0.32 -> 0.32)
    const engagementMultiplier = scores.engagement / 100;
    const friendlinessMultiplier = scores.friendliness / 100;
    const viralityMultiplier = scores.virality / 100;

    // Base metrics that scale with engagement and virality scores
    const baseReplies = Math.round(50 * engagementMultiplier + 30 * friendlinessMultiplier);
    const baseReposts = Math.round(40 * viralityMultiplier + 20 * engagementMultiplier);
    const baseLikes = Math.round(100 * engagementMultiplier + 50 * friendlinessMultiplier);

    // Views scale with a base of 1000 and multiply by engagement and virality
    const baseViews = Math.round(
      1000 * (1 + engagementMultiplier * 2) * (1 + viralityMultiplier * 3)
    );

    // Use deterministic pseudo-randomness based on stable inputs to avoid hydration mismatch
    const seedBase = hashStringToNumber(
      `${id}|${content}|${scores.engagement}|${scores.friendliness}|${scores.virality}`
    );
    const withFactor = (base: number, offset: number) => {
      const factor = deterministicMultiplier(seedBase + offset);
      return Math.round(base * factor);
    };

    return {
      replies: withFactor(baseReplies, 1),
      reposts: withFactor(baseReposts, 2),
      likes: withFactor(baseLikes, 3),
      views: withFactor(baseViews, 4),
    };
  };

  const metrics = calculateMetrics();

  // Format large numbers (e.g., 1.2K, 1.5M)
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('w-full overflow-hidden rounded-none bg-black p-3', className)}
    >
      <div className="flex h-full gap-3">
        {/* Profile Picture */}
        {spot.available ? (
          <Link
            href={url}
            target="_blank"
            className="group relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-full bg-[#2f3336] transition-colors hover:bg-[#2f3336]/80"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-[#71767b]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </div>
          </Link>
        ) : (
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-full bg-[#2f3336] transition-transform hover:scale-105"
          >
            <Avatar className="size-10">
              <AvatarImage src={spot?.data?.avatar} alt={`@${spot.data.username}`} />
              <AvatarFallback>
                {(spot?.data?.name as string)?.substring(0, 2).toUpperCase() +
                  spot?.data?.name?.substring(2)}
              </AvatarFallback>
            </Avatar>
          </Link>
        )}

        {/* Content */}
        <div className="flex h-full min-w-0 flex-col justify-between">
          {/* Username and Handle */}
          <div className="flex items-center justify-between gap-2">
            {spot.available ? (
              <Link href={url} target="_blank" className="flex items-center gap-1 text-[15px]">
                <span className="cursor-pointer font-bold text-[#1d9bf0] hover:underline">
                  Want to be our sponsor?
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-1 text-[15px]">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-white hover:underline"
                >
                  {spot.data.name}
                </a>
                {spot.data.verified && (
                  <svg className="h-4 w-4 text-[#1d9bf0]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" />
                  </svg>
                )}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#71767b] hover:underline"
                >
                  @{spot.data.username}
                </a>
              </div>
            )}
            <div className="flex items-center gap-1 text-[13px] text-[#71767b]">
              <span>Ads</span>
              <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </div>
          </div>

          {/* Post Text */}
          <div className="text-[15px] whitespace-pre-wrap text-white">
            {spot.available ? (
              <div className="space-y-2 text-[#71767b]">
                <p className="text-sm">
                  Reach thousands of engaged & influential X users. Now accepting sponsorship
                  enquiries from aligned brands.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                  <span className="text-[#1d9bf0]">
                    {formatPrice(spot.price, 'USD')} for {formatDuration(spot.duration)}
                  </span>
                  <span>Available now</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs text-[#71767b]">{spot.data.bio}</div>

                <p className="mt-3" dangerouslySetInnerHTML={{ __html: content }}></p>
              </div>
            )}
          </div>

          {/* Post Actions */}
          <div className="mt-3 flex max-w-md justify-between text-[#71767b]">
            <div className="group flex items-center">
              <div className="rounded-full p-2 group-hover:bg-[#1d1f23] group-hover:text-[#1d9bf0]">
                <svg className="h-[1em]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
                  />
                </svg>
              </div>
              <span className="text-xs">{formatNumber(metrics.replies)}</span>
            </div>

            <div className="group flex items-center">
              <div className="rounded-full p-2 group-hover:bg-[#071a14] group-hover:text-[#00ba7c]">
                <Repeat2 className="size-4" />
              </div>
              <span className="text-xs">{formatNumber(metrics.reposts)}</span>
            </div>

            <div className="group flex items-center">
              <div className="rounded-full p-2 group-hover:bg-[#1a1221] group-hover:text-[#f91880]">
                <svg className="h-[1em]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              </div>
              <span className="text-xs">{formatNumber(metrics.likes)}</span>
            </div>

            <div className="group flex items-center">
              <div className="rounded-full p-2 group-hover:bg-[#1d1f23] group-hover:text-[#1d9bf0]">
                <svg className="h-[1em]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </div>
              <span className="text-xs">{formatNumber(metrics.views)}</span>
            </div>

            <div className="group flex items-center">
              <div className="rounded-full p-2 group-hover:bg-[#1d1f23] group-hover:text-[#1d9bf0]">
                <svg className="h-[1.25em]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
