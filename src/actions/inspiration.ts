'use server';

import { unstable_cache as nextCache } from 'next/cache';

// Re-using our standard InspirationExample interface for consistency
export interface InspirationExample {
  id: string; // Tweet ID (from tweetbutler response)
  niche: string; // Niche used for search (passed context)
  text: string; // Tweet text (full_text from tweetbutler)
  userName?: string; // From tweetbutler user object
  userHandle?: string; // From tweetbutler user object (username)
  userAvatarUrl?: string; // From tweetbutler user object (profile_image_url_https)
  userVerified?: boolean; // From tweetbutler user object
  metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    bookmark_count?: number;
    impression_count?: number;
  };
  createdAt?: string; // From tweetbutler tweet object (created_at)
  // Media fields from tweetbutler extended_entities
  mediaUrl?: string;
  mediaType?: 'photo' | 'video' | 'animated_gif';
}

// Interfaces based on the provided tweetbutler API response example
interface THPublicMetrics {
  retweet_count: number;
  reply_count: number;
  like_count: number;
  quote_count: number;
  bookmark_count?: number; // Use optional if not always present
  impression_count?: number; // Use optional if not always present
}

interface THUser {
  id: string;
  id_str?: string;
  name?: string;
  username?: string; // Maps to userHandle
  screen_name?: string; // Alternative handle?
  profile_image_url_https?: string; // Maps to userAvatarUrl
  verified?: boolean;
  verified_type?: string; // e.g., "blue"
  // Add other user fields if needed from the example
}

// Interface for media objects within extended_entities
interface THMedia {
  media_url_https?: string;
  type?: 'photo' | 'video' | 'animated_gif'; // Type of media
  // Add other media fields if needed (e.g., sizes, video_info)
}

interface THExtendedEntities {
  media?: THMedia[];
}

interface THTweet {
  id: string; // Maps to InspirationExample id
  id_str?: string;
  text: string; // Raw text, potentially truncated
  full_text?: string; // Prefer this for InspirationExample text
  created_at?: string; // Maps to createdAt
  author_id?: string;
  public_metrics?: THPublicMetrics;
  user?: THUser; // Nested user object
  extended_entities?: THExtendedEntities; // Added for media
  // Add other tweet fields if needed (e.g., entities for media?)
}

interface THResponse {
  tweets?: THTweet[];
  nbTotalTweets?: number;
  success?: number;
  error?: string | null;
  // Add other potential response fields
}

const TH_API_URL = process.env.TH_API_URL;

async function fetchTweetsFromTHImpl(query: string): Promise<THResponse> {
  // --- SECURITY WARNING ---
  // These tokens MUST be set via environment variables
  const bearerToken = process.env.TH_BEARER_TOKEN;
  const accessToken = process.env.TH_ACCESS_TOKEN;
  const secretToken = process.env.TH_SECRET_TOKEN;
  const userId = process.env.TH_USERID; // User ID might also be needed from env

  if (!bearerToken || !accessToken || !secretToken || !userId) {
    console.error(
      'Missing required TH API credentials/config (Bearer Token, Access Token, Secret Token, User ID) in environment variables.'
    );
    throw new Error('TH API credentials missing.');
  }

  // Construct query parameters based on the example
  const params = new URLSearchParams({
    topic: query, // Use the generic query string directly
    count: '10',
    randomize: 'true',
    description: '',
    userId: userId,
    noHashtag: 'true',
    isPersonalizedSorting: 'true',
    useBestAi: 'false',
    twClientId: 'undefined',
    twClientSecret: 'undefined',
    twAccessToken: accessToken,
    twSecretToken: secretToken,
    thApp: 'T_TWEETHUTLERBOT_AUTO_REPLY',
    app: 'T_TWEETHUTLERBOT_AUTO_REPLY',
    tokenType: 'read',
    nbMinDaysOld: '30',
    nbMaxDaysOld: '1000',
    nbMinLikes: '90',
    nbMinRt: '0',
  });

  const fullUrl = `${TH_API_URL}?${params.toString()}`;

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: '*/*',
        'Content-Type': 'application/json',
        Origin: 'https://app.tweethunter.io',
        Referer: 'https://app.tweethunter.io/',
        Priority: 'u=3, i',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        tokenuserid: userId,
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15',
      },
      next: { revalidate: 960 },
    });

    const data: THResponse = await response.json();

    if (!response.ok || data.success !== 1) {
      console.error(
        `TH API Error (${response.status}): ${data.error || 'Unknown error'}`,
        JSON.stringify(data)
      );
      const error = new Error(
        `Failed to fetch tweets from API. Status: ${response.status}, Query: ${query}`
      );
      (error as Error & { responseBody?: unknown }).responseBody = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching or parsing tweets from TH API:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred during TH API fetch');
  }
}

// Wrap the fetch function with Next.js cache
const fetchTweetsFromTH = nextCache(
  fetchTweetsFromTHImpl, // Pass the function directly
  ['th-api-tweets'], // Updated base cache key segment for safety
  {
    revalidate: 960, // Cache duration: 16 minutes
    tags: ['inspiration-tweets-tb'], // Unique tag
  }
);

// --- Main Action Function ---
export async function getInspirationExamples(
  searchQuery: string, // Accept the pre-formatted query
  nicheContext?: string | null
): Promise<InspirationExample[]> {
  try {
    const apiResponse = await fetchTweetsFromTH(searchQuery);

    const tweets = apiResponse.tweets ?? [];

    if (tweets.length === 0) {
      // no posts for query
      return [];
    }

    const examples: InspirationExample[] = tweets
      .map(tweet => {
        const firstMedia = tweet.extended_entities?.media?.[0];
        const mediaUrl = firstMedia?.media_url_https;
        const mediaType =
          firstMedia?.type && ['photo', 'video', 'animated_gif'].includes(firstMedia.type)
            ? (firstMedia.type as 'photo' | 'video' | 'animated_gif')
            : undefined;

        return {
          id: tweet.id_str || tweet.id,
          niche: nicheContext || 'General',
          text: tweet.full_text || tweet.text,
          userName: tweet.user?.name,
          userHandle: tweet.user?.username || tweet.user?.screen_name,
          userAvatarUrl: tweet.user?.profile_image_url_https,
          userVerified: tweet.user?.verified || tweet.user?.verified_type === 'blue',
          createdAt: tweet.created_at,
          metrics: {
            retweet_count: tweet.public_metrics?.retweet_count ?? 0,
            reply_count: tweet.public_metrics?.reply_count ?? 0,
            like_count: tweet.public_metrics?.like_count ?? 0,
            quote_count: tweet.public_metrics?.quote_count ?? 0,
            bookmark_count: tweet.public_metrics?.bookmark_count,
            impression_count: tweet.public_metrics?.impression_count,
          },
          mediaUrl: mediaUrl,
          mediaType: mediaType,
        };
      })
      .sort((a, b) => (b.metrics?.like_count ?? 0) - (a.metrics?.like_count ?? 0))
      .slice(0, 10);

    return examples;
  } catch (error) {
    console.error('Error in getInspirationExamples:', error);
    return []; // Return empty array on failure
  }
}
