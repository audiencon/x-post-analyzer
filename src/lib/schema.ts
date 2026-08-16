import { FAQ_ITEMS } from '@/config/faq';
import {
  FOUNDER_PRICE_USD,
  PRO_MONTHLY_PRICE_USD,
  STUDIO_MONTHLY_PRICE_USD,
} from '@/config/billing';
import { SITE } from '@/config/site';

export type JsonLdNode = Record<string, unknown>;

export type Crumb = {
  name: string;
  path: string;
};

const orgId = `${SITE.url}/#organization`;
const personId = `${SITE.url}/#person`;
const websiteId = `${SITE.url}/#website`;
const appId = `${SITE.url}/#app`;

export function organizationNode(): JsonLdNode {
  return {
    '@type': 'Organization',
    '@id': orgId,
    name: SITE.name,
    url: SITE.url,
    logo: SITE_OG_IMAGE_ABS(),
    description: SITE.description,
    sameAs: [...SITE.sameAs],
    founder: { '@id': personId },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: SITE.founder.url,
    },
  };
}

export function personNode(): JsonLdNode {
  return {
    '@type': 'Person',
    '@id': personId,
    name: SITE.founder.name,
    url: SITE.founder.url,
    sameAs: [...SITE.founder.sameAs],
    jobTitle: 'Founder',
    worksFor: { '@id': orgId },
    knowsAbout: [
      'X writing',
      'tweet critique',
      'Original Content Rewards',
      'thread editing',
    ],
  };
}

export function websiteNode(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': websiteId,
    name: SITE.name,
    url: SITE.url,
    description: SITE.shortDescription,
    inLanguage: 'en-US',
    publisher: { '@id': orgId },
  };
}

export function softwareApplicationNode(): JsonLdNode {
  return {
    '@type': ['SoftwareApplication', 'WebApplication'],
    '@id': appId,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript and a modern browser',
    offers: [
      offer('Roast', '0', 'Ten roasts a day after sign-in'),
      offer('Pro', String(PRO_MONTHLY_PRICE_USD), 'Unlimited roasts and roast history'),
      offer('Studio', String(STUDIO_MONTHLY_PRICE_USD), 'Unlimited drafts and critique'),
      offer('Founder', String(FOUNDER_PRICE_USD), 'Lifetime Studio, 100 seats'),
    ],
    featureList: [
      'AI roast of X and Twitter drafts',
      'Engage, Warmth, Viral, and Payout scores',
      'Rewrite angles you would actually post',
      'Studio thread editor',
      'Shareable roast cards',
      'Original Content Rewards shape flags',
    ],
    screenshot: SITE_OG_IMAGE_ABS(),
    creator: { '@id': personId },
    publisher: { '@id': orgId },
  };
}

export function faqPageNode(url = `${SITE.url}/#faq`): JsonLdNode {
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faqpage`,
    url,
    mainEntity: FAQ_ITEMS.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
    isPartOf: { '@id': websiteId },
  };
}

export function webPageNode({
  path,
  name,
  description,
  speakable = false,
}: {
  path: string;
  name: string;
  description: string;
  speakable?: boolean;
}): JsonLdNode {
  const url = path === '/' ? SITE.url : `${SITE.url}${path}`;
  return {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { '@id': websiteId },
    about: { '@id': appId },
    publisher: { '@id': orgId },
    inLanguage: 'en-US',
    dateModified: SITE.legalUpdated,
    ...(speakable
      ? {
          speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: ['.speakable'],
          },
        }
      : {}),
  };
}

export function breadcrumbNode(items: Crumb[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path === '/' ? SITE.url : `${SITE.url}${item.path}`,
    })),
  };
}

export function schemaGraph(nodes: JsonLdNode[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  };
}

export function homeGraph(): JsonLdNode {
  return schemaGraph([
    organizationNode(),
    personNode(),
    websiteNode(),
    softwareApplicationNode(),
    webPageNode({
      path: '/',
      name: `${SITE.name} — ${SITE.tagline}`,
      description: SITE.description,
      speakable: true,
    }),
    faqPageNode(`${SITE.url}/#faq`),
  ]);
}

export function pageGraph({
  path,
  name,
  description,
  crumbs,
  speakable = false,
  includeApp = true,
  extra = [],
}: {
  path: string;
  name: string;
  description: string;
  crumbs: Crumb[];
  speakable?: boolean;
  includeApp?: boolean;
  extra?: JsonLdNode[];
}): JsonLdNode {
  return schemaGraph([
    organizationNode(),
    websiteNode(),
    ...(includeApp ? [softwareApplicationNode()] : []),
    webPageNode({ path, name, description, speakable }),
    breadcrumbNode(crumbs),
    ...extra,
  ]);
}

export function crumbsFor(path: string, name: string, parents: Crumb[] = []): Crumb[] {
  return [{ name: SITE.name, path: '/' }, ...parents, { name, path }];
}

export function legalGraph(path: '/terms' | '/privacy', name: string, description: string): JsonLdNode {
  return pageGraph({
    path,
    name,
    description,
    crumbs: crumbsFor(path, name),
    includeApp: false,
  });
}

export function comparisonGraph({
  slug,
  name,
  title,
  description,
  verdict,
  price,
  postroastPrice,
  updated,
}: {
  slug: string;
  name: string;
  title: string;
  description: string;
  verdict: string;
  price: string;
  postroastPrice: string;
  updated: string;
}): JsonLdNode {
  const path = `/vs/${slug}`;
  return pageGraph({
    path,
    name: title,
    description,
    crumbs: crumbsFor(path, `vs ${name}`, [{ name: 'Compare', path: '/vs' }]),
    extra: [
      {
        '@type': 'FAQPage',
        '@id': `${SITE.url}${path}#faqpage`,
        url: `${SITE.url}${path}`,
        mainEntity: [
          {
            '@type': 'Question',
            name: `Is PostRoast a ${name} alternative?`,
            acceptedAnswer: { '@type': 'Answer', text: verdict },
          },
          {
            '@type': 'Question',
            name: `What does ${name} cost vs PostRoast?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${name} is ${price}. PostRoast is ${postroastPrice}. Figures as of ${updated}.`,
            },
          },
        ],
      },
    ],
  });
}

export function faqGraph(): JsonLdNode {
  return pageGraph({
    path: '/faq',
    name: 'PostRoast FAQ',
    description:
      'Answers about accounts, scores, Pro vs Studio, Compose on X, and what happens to drafts.',
    crumbs: crumbsFor('/faq', 'FAQ'),
    speakable: true,
    extra: [faqPageNode(`${SITE.url}/faq`)],
  });
}

export function roastCardGraph({
  id,
  roast,
  content,
  score,
  datePublished,
}: {
  id: string;
  roast: string;
  content: string;
  score: number;
  datePublished: string;
}): JsonLdNode {
  const path = `/r/${id}`;
  return pageGraph({
    path,
    name: `Roast card · ${score}`,
    description: roast,
    crumbs: crumbsFor(path, `Card ${score}`, [{ name: 'Roast', path: '/roast' }]),
    extra: [
      {
        '@type': 'Review',
        '@id': `${SITE.url}${path}#review`,
        author: { '@id': `${SITE.url}/#organization` },
        reviewBody: roast,
        datePublished,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: score,
          bestRating: 100,
          worstRating: 0,
        },
        itemReviewed: {
          '@type': 'SocialMediaPosting',
          headline: content.slice(0, 110),
          text: content,
        },
      },
    ],
  });
}

function offer(name: string, price: string, description: string): JsonLdNode {
  return {
    '@type': 'Offer',
    name,
    description,
    price,
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: `${SITE.url}/#pricing`,
  };
}

function SITE_OG_IMAGE_ABS() {
  return `${SITE.url}${SITE.ogImagePath}`;
}
