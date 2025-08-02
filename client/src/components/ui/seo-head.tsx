import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
}

export function SEOHead({
  title = "ExploreNow - Smart Travel Platform",
  description = "Discover, plan, and book your perfect trip with ExploreNow's AI-powered recommendations, real-time currency conversion, and intelligent travel tools.",
  keywords = "travel planning, AI recommendations, trip booking, hotel booking, currency converter, travel reviews, vacation planning",
  canonicalUrl = "https://explorenow.replit.app/",
  ogTitle,
  ogDescription,
  ogImage = "/og-image.png",
  ogType = "website"
}: SEOHeadProps) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle || title} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="ExploreNow" />
      <meta name="language" content="en" />
      <meta name="revisit-after" content="7 days" />
    </Helmet>
  );
}