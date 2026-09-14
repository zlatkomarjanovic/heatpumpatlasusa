/**
 * Page metadata types used by the SEO component and layouts.
 */

export type Breadcrumb = {
  label: string;
  href?: string;
};

export type SchemaType = 'WebPage' | 'Article' | 'FAQPage' | 'SoftwareApplication' | 'CollectionPage';