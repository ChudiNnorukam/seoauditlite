import type { AuditResult, AuditCheckStatus } from '$lib/auditing/schema';

export type ImageTemplate = 'seo-audit' | 'linkedin-thumbnail' | 'blog-header' | 'product-card';

export interface TemplateConfig {
  title: string;
  subtitle?: string;
  colorScheme?: 'blue' | 'orange' | 'purple' | 'green';
  domain?: string;
  score?: number;
  metrics?: { passes: number; warnings: number; fails: number };
}

function getScoreGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'amber/yellow';
  return 'red';
}

export function generateSeoAuditPrompt(audit: AuditResult): string {
  const domain = new URL(audit.audited_url).hostname;
  const score = Math.round(audit.overall_score);
  const grade = getScoreGrade(score);
  const scoreColor = getScoreColor(score);

  const statusCounts = audit.checks.reduce(
    (acc, check) => {
      acc[check.status]++;
      return acc;
    },
    { pass: 0, warning: 0, fail: 0 } as Record<AuditCheckStatus, number>
  );

  return `Professional minimalist OG image card for an SEO audit report. Clean white background with subtle grid pattern.

Main elements:
- Large circular score indicator showing "${score}" with grade "${grade}" in ${scoreColor} color
- Domain name "${domain}" in clean sans-serif typography
- Three small status badges: ${statusCounts.pass} green checkmarks, ${statusCounts.warning} amber warnings, ${statusCounts.fail} red X marks
- "AI Engine Optimization Audit" subtitle text
- Modern, tech-forward aesthetic like Linear or Notion

Style: Ultra-minimal, professional, 1200x630 pixels, high contrast, no gradients, clean typography, Jony Ive inspired design aesthetic.`;
}

export function generateLinkedInThumbnailPrompt(config: TemplateConfig): string {
  const colorMap = {
    blue: 'deep blue (#1E40AF)',
    orange: 'vibrant orange (#EA580C)',
    purple: 'rich purple (#7C3AED)',
    green: 'emerald green (#059669)',
  };

  const accentColor = colorMap[config.colorScheme ?? 'blue'];

  return `Professional LinkedIn post thumbnail image. Clean white background with ${accentColor} accent elements.

Main elements:
- Bold headline: "${config.title}"
${config.subtitle ? `- Subtitle: "${config.subtitle}"` : ''}
- Abstract geometric shapes as decorative elements
- Modern, professional tech aesthetic

Style: Minimal, clean, 1200x630 pixels, high contrast, no photos or faces, corporate professional look, suitable for business content.`;
}

export function generateBlogHeaderPrompt(config: TemplateConfig): string {
  const colorMap = {
    blue: 'cool blue tones',
    orange: 'warm orange and coral tones',
    purple: 'elegant purple and violet tones',
    green: 'fresh green and teal tones',
  };

  const colorTone = colorMap[config.colorScheme ?? 'blue'];

  return `Abstract blog header image with ${colorTone}. Soft gradient background with subtle geometric patterns.

Main elements:
- Title area for: "${config.title}"
${config.subtitle ? `- Space for subtitle: "${config.subtitle}"` : ''}
- Flowing abstract shapes suggesting technology and innovation
- Clean negative space for text overlay

Style: Editorial, modern, 1200x630 pixels, soft gradients, abstract and artistic, suitable for tech blog posts.`;
}

export function generateProductCardPrompt(config: TemplateConfig): string {
  return `Product showcase card image. Minimal white background with subtle shadow effects.

Main elements:
- Product name: "${config.title}"
${config.subtitle ? `- Tagline: "${config.subtitle}"` : ''}
- Abstract representation of software/digital product
- Clean iconographic elements suggesting features
- Professional SaaS aesthetic

Style: Product-focused, clean, 1200x630 pixels, minimal, Apple-like product photography aesthetic but for software, elegant shadows.`;
}

export function generatePromptFromTemplate(template: ImageTemplate, config: TemplateConfig): string {
  switch (template) {
    case 'linkedin-thumbnail':
      return generateLinkedInThumbnailPrompt(config);
    case 'blog-header':
      return generateBlogHeaderPrompt(config);
    case 'product-card':
      return generateProductCardPrompt(config);
    default:
      throw new Error(`Unknown template: ${template}`);
  }
}
