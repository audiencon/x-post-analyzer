'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import spotsConfig from '@/config/spots.json';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import Image from 'next/image';

interface BannerSpotProps {
  id: string;
  className?: string;
}

export function BannerSpot({ id, className }: BannerSpotProps) {
  const spot = spotsConfig.spots.find(s => s.id === id);
  if (!spot) return null;

  const url = spot.available ? spot.stripeUrl : spot.data.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('w-full bg-[#0f0f0f] px-4 py-2 text-sm text-[#e7e9ea]', className)}
    >
      <Link
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mx-auto flex max-w-7xl items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#71767b]">Ad</span>
          <span className="text-[#1d9bf0]">•</span>
          {!spot.available ? (
            spot.logo && <Image src={spot.logo} alt={spot.data.title} width={24} height={24} />
          ) : (
            <div className="group relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-full bg-[#2f3336] transition-colors hover:bg-[#2f3336]/80">
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
            </div>
          )}
          <span className="font-bold">
            {!spot.available ? spot.data.title : 'Want to be our sponsor?'}
          </span>
          <span className="text-[#1d9bf0]">–</span>
          <span>
            {!spot.available
              ? spot.data.description
              : 'Get your product featured here. Reach thousands of users.'}
          </span>
        </div>
        <div
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'border-white/20 bg-transparent text-xs'
          )}
        >
          {spot.available ? 'Book now' : 'Learn more'}
        </div>
      </Link>
    </motion.div>
  );
}
