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
          {spot.logo && <Image src={spot.logo} alt={spot.data.title} width={24} height={24} />}
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
