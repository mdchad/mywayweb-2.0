/**
 * Utility functions to generate JSON-LD structured data for SEO
 */

const ORG_LOGO = {
  "@type": "ImageObject",
  url: "https://www.myway.my/logo.png",
  width: 4096,
  height: 4096,
} as const;

// External profiles that prove brand identity. Add only verified URLs:
// fabricated entries hurt Knowledge Graph reconciliation more than they help.
const ORG_SAME_AS: string[] = [];

// Wikipedia anchors for the six canonical imams. Used as `sameAs` on Person
// nodes so AI/Knowledge-Graph systems can resolve them as known entities.
const IMAM_WIKIPEDIA: Record<string, string> = {
  bukhari: "https://en.wikipedia.org/wiki/Muhammad_al-Bukhari",
  muslim: "https://en.wikipedia.org/wiki/Muslim_ibn_al-Hajjaj",
  "abi-daud": "https://en.wikipedia.org/wiki/Abu_Dawood",
  tirmidhi: "https://en.wikipedia.org/wiki/Al-Tirmidhi",
  nasai: "https://en.wikipedia.org/wiki/Al-Nasa%27i",
  "ibn-majah": "https://en.wikipedia.org/wiki/Ibn_Majah",
};

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "My Way",
    alternateName: "My Way - Koleksi Hadis Sahih",
    description:
      "Pelajari sunnah Nabi Muhammad SAW melalui koleksi hadis dari Kutub Sittah yang sahih dan dipercayai",
    url: "https://www.myway.my",
    logo: ORG_LOGO,
    ...(ORG_SAME_AS.length > 0 && { sameAs: ORG_SAME_AS }),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      url: "https://www.myway.my",
    },
  };
}

export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateCreativeWorkSchema(params: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  inLanguage?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: params.title,
    description: params.description,
    url: params.url,
    image: params.image || "https://www.myway.my/api/og",
    inLanguage: params.inLanguage || ["ms", "ar", "en"],
    publisher: {
      "@type": "Organization",
      name: "My Way",
      url: "https://www.myway.my",
    },
    ...(params.datePublished && { datePublished: params.datePublished }),
  };
}

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "My Way",
    url: "https://www.myway.my",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.myway.my/search?term={search_term}",
      },
      "query-input": "required name=search_term",
    },
  };
}

export function generateCollectionSchema(params: {
  name: string;
  description: string;
  url: string;
  itemCount: number;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Collection",
    name: params.name,
    description: params.description,
    url: params.url,
    image: params.image || "https://www.myway.my/api/og",
    numberOfItems: params.itemCount,
    provider: {
      "@type": "Organization",
      name: "My Way",
      url: "https://www.myway.my",
    },
  };
}

export function generateBookSchema(params: {
  title: string;
  description: string;
  url: string;
  image?: string;
  author?: string;
  numberOfPages?: number;
  inLanguage?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: params.title,
    description: params.description,
    url: params.url,
    image: params.image || "https://www.myway.my/api/og",
    inLanguage: params.inLanguage || ["ms", "ar", "en"],
    ...(params.author && { author: { "@type": "Person", name: params.author } }),
    ...(params.numberOfPages && { numberOfPages: params.numberOfPages }),
    publisher: {
      "@type": "Organization",
      name: "My Way",
      url: "https://www.myway.my",
    },
  };
}

export function generateItemListSchema(items: Array<{
  position: number;
  name: string;
  url: string;
  image?: string;
  description?: string;
}>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      url: item.url,
      image: item.image,
      description: item.description,
    })),
  };
}

export function generateKutubSittahHadithSchema(params: {
  bookSlug: string;
  bookTitle: string;
  number: number | string;
  chapterTitle?: string;
  description: string;
  url: string;
  imam?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}) {
  const name = params.chapterTitle
    ? `${params.bookTitle} No. ${params.number}: ${params.chapterTitle}`
    : `${params.bookTitle} No. ${params.number}`;
  // Human-readable scholarly citation. AI overviews and Knowledge Graph use
  // the `citation` field verbatim when surfacing a quoted passage.
  const citation = params.chapterTitle
    ? `${params.bookTitle}, ${params.chapterTitle}, No. ${params.number}`
    : `${params.bookTitle}, No. ${params.number}`;

  const imamWiki = IMAM_WIKIPEDIA[params.bookSlug];
  const imamPerson = params.imam
    ? {
        "@type": "Person",
        name: params.imam,
        ...(imamWiki && { sameAs: imamWiki }),
      }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Quotation",
    name,
    description: params.description,
    url: params.url,
    image: params.image || "https://www.myway.my/opengraph-image.jpg",
    inLanguage: ["ms", "ar"],
    citation,
    ...(params.datePublished && { datePublished: params.datePublished }),
    ...(params.dateModified && { dateModified: params.dateModified }),
    ...(imamPerson && { creator: imamPerson }),
    publisher: {
      "@type": "Organization",
      name: "My Way",
      url: "https://www.myway.my",
      logo: ORG_LOGO,
    },
    isPartOf: {
      "@type": "Book",
      name: params.bookTitle,
      url: `https://www.myway.my/book/${params.bookSlug}`,
      ...(imamPerson && { author: imamPerson }),
    },
  };
}

export function generateHadith40ArticleSchema(params: {
  number: number;
  title: string;
  description: string;
  url: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: params.title,
    description: params.description,
    url: params.url,
    image: params.image || "https://www.myway.my/opengraph-image.jpg",
    inLanguage: ["ms", "ar"],
    articleSection: `Hadis ${params.number}`,
    author: { "@type": "Person", name: "Imam An-Nawawi" },
    publisher: {
      "@type": "Organization",
      name: "My Way",
      url: "https://www.myway.my",
      logo: {
        "@type": "ImageObject",
        url: "https://www.myway.my/logo.png",
      },
    },
    isPartOf: {
      "@type": "Collection",
      name: "40 Hadis Imam Nawawi (Arba'in Nawawiyyah)",
      url: "https://www.myway.my/hadis40",
    },
  };
}

export function generateHadithCollectionSchema(params: {
  name: string;
  description: string;
  url: string;
  bookCount: number;
  hadithCount: number;
  inLanguage?: string[];
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Collection",
    name: params.name,
    description: params.description,
    url: params.url,
    image: params.image || "https://www.myway.my/api/og",
    inLanguage: params.inLanguage || ["ms", "ar", "en"],
    collectionSize: params.hadithCount,
    hasPart: {
      "@type": "Collection",
      name: "Hadith Books (Kutub Sittah)",
      collectionSize: params.bookCount,
    },
    publisher: {
      "@type": "Organization",
      name: "My Way",
      url: "https://www.myway.my",
    },
    creator: {
      "@type": "Organization",
      name: "Islamic Scholars",
    },
    about: {
      "@type": "Thing",
      name: "Kutub Sittah - Six Major Hadith Collections",
      description: "The Six Major Hadith Collections in Islamic tradition",
    },
  };
}
