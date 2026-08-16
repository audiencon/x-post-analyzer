import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isProPlan, isStudioPlan } from '@/config/billing';

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireUser(next: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  }
  return user;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      planStatus: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });

  if (!user) return null;

  return {
    ...user,
    isPro: isProPlan(user.plan, user.planStatus),
    isStudio: isStudioPlan(user.plan, user.planStatus),
  };
}
