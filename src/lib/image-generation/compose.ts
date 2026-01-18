// Image composition module - overlays text on AI-generated backgrounds using sharp
import sharp from 'sharp';
import type { AuditImageData } from './templates';

const WIDTH = 1200;
const HEIGHT = 630;

function getScoreRingColor(scoreColor: 'green' | 'amber' | 'red'): string {
  switch (scoreColor) {
    case 'green':
      return '#16a34a';
    case 'amber':
      return '#ca8a04';
    case 'red':
      return '#dc2626';
  }
}

function getScoreRingBgColor(scoreColor: 'green' | 'amber' | 'red'): string {
  switch (scoreColor) {
    case 'green':
      return '#dcfce7';
    case 'amber':
      return '#fef3c7';
    case 'red':
      return '#fee2e2';
  }
}

function createScoreRingSvg(score: number, scoreColor: 'green' | 'amber' | 'red'): string {
  const ringColor = getScoreRingColor(scoreColor);
  const bgColor = getScoreRingBgColor(scoreColor);
  const circumference = 2 * Math.PI * 70; // radius 70
  const progress = (score / 100) * circumference;
  const dashArray = `${progress} ${circumference}`;

  return `
    <svg width="180" height="180" viewBox="0 0 180 180">
      <!-- Background circle -->
      <circle cx="90" cy="90" r="70" fill="white" stroke="${bgColor}" stroke-width="12"/>
      <!-- Progress arc -->
      <circle cx="90" cy="90" r="70" fill="none" stroke="${ringColor}" stroke-width="12"
        stroke-dasharray="${dashArray}" stroke-linecap="round"
        transform="rotate(-90 90 90)"/>
      <!-- Score text -->
      <text x="90" y="95" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif"
        font-size="48" font-weight="700" fill="${ringColor}">${score}</text>
      <text x="90" y="125" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif"
        font-size="14" font-weight="500" fill="#64748b" letter-spacing="0.05em">SCORE</text>
    </svg>
  `;
}

function createStatusBadgesSvg(passes: number, warnings: number, fails: number): string {
  return `
    <svg width="200" height="32" viewBox="0 0 200 32">
      <!-- Pass badge -->
      <rect x="0" y="0" width="56" height="28" rx="6" fill="#dcfce7"/>
      <text x="14" y="19" font-family="system-ui, sans-serif" font-size="14" fill="#16a34a">✓</text>
      <text x="30" y="19" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#16a34a">${passes}</text>

      <!-- Warning badge -->
      <rect x="66" y="0" width="56" height="28" rx="6" fill="#fef3c7"/>
      <text x="80" y="19" font-family="system-ui, sans-serif" font-size="14" fill="#ca8a04">!</text>
      <text x="96" y="19" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#ca8a04">${warnings}</text>

      <!-- Fail badge -->
      <rect x="132" y="0" width="56" height="28" rx="6" fill="#fee2e2"/>
      <text x="146" y="19" font-family="system-ui, sans-serif" font-size="14" fill="#dc2626">✕</text>
      <text x="162" y="19" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#dc2626">${fails}</text>
    </svg>
  `;
}

function createTextOverlaySvg(data: AuditImageData): string {
  const scoreRing = createScoreRingSvg(data.score, data.scoreColor);
  const statusBadges = createStatusBadgesSvg(data.passes, data.warnings, data.fails);

  // Truncate domain if too long
  const displayDomain = data.domain.length > 30
    ? data.domain.substring(0, 27) + '...'
    : data.domain;

  return `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.1)"/>
        </filter>
      </defs>

      <!-- Semi-transparent card background -->
      <rect x="60" y="100" width="1080" height="430" rx="16" fill="rgba(255,255,255,0.85)" filter="url(#shadow)"/>

      <!-- Score ring positioned left -->
      <g transform="translate(140, 200)">
        ${scoreRing}
      </g>

      <!-- Right side content -->
      <g transform="translate(380, 180)">
        <!-- Domain name -->
        <text font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
          font-size="42" font-weight="700" fill="#0f172a" letter-spacing="-0.02em">
          ${escapeXml(displayDomain)}
        </text>

        <!-- Subtitle -->
        <text y="50" font-family="system-ui, -apple-system, sans-serif"
          font-size="18" fill="#64748b">
          AI Engine Optimization Audit
        </text>

        <!-- Status badges -->
        <g transform="translate(0, 90)">
          ${statusBadges}
        </g>

        <!-- Grade badge -->
        <g transform="translate(0, 150)">
          <rect width="80" height="36" rx="8" fill="${getScoreRingColor(data.scoreColor)}"/>
          <text x="40" y="25" text-anchor="middle" font-family="system-ui, sans-serif"
            font-size="18" font-weight="700" fill="white">
            Grade ${data.grade}
          </text>
        </g>
      </g>

      <!-- Branding -->
      <text x="1100" y="490" text-anchor="end" font-family="system-ui, sans-serif"
        font-size="14" fill="#94a3b8">
        seoauditlite.com
      </text>
    </svg>
  `;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function composeOgImage(
  backgroundUrl: string,
  data: AuditImageData
): Promise<Buffer> {
  // Fetch the AI-generated background
  const response = await fetch(backgroundUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch background image: ${response.status}`);
  }
  const backgroundBuffer = Buffer.from(await response.arrayBuffer());

  // Create the text overlay SVG
  const overlaySvg = createTextOverlaySvg(data);
  const overlayBuffer = Buffer.from(overlaySvg);

  // Composite the overlay onto the background
  const result = await sharp(backgroundBuffer)
    .resize(WIDTH, HEIGHT, { fit: 'cover' })
    .composite([
      {
        input: overlayBuffer,
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}

// Generate a fallback solid color background if AI generation fails
export async function generateFallbackBackground(scoreColor: 'green' | 'amber' | 'red'): Promise<Buffer> {
  const bgColor = scoreColor === 'green' ? '#f0fdf4' : scoreColor === 'amber' ? '#fffbeb' : '#fef2f2';

  const svg = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <circle cx="100" cy="100" r="200" fill="${getScoreRingColor(scoreColor)}" opacity="0.05"/>
      <circle cx="1100" cy="530" r="150" fill="${getScoreRingColor(scoreColor)}" opacity="0.05"/>
    </svg>
  `;

  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}

export async function composeOgImageWithFallback(
  backgroundUrl: string | null,
  data: AuditImageData
): Promise<Buffer> {
  let backgroundBuffer: Buffer;

  if (backgroundUrl) {
    try {
      const response = await fetch(backgroundUrl);
      if (response.ok) {
        backgroundBuffer = Buffer.from(await response.arrayBuffer());
      } else {
        backgroundBuffer = await generateFallbackBackground(data.scoreColor);
      }
    } catch {
      backgroundBuffer = await generateFallbackBackground(data.scoreColor);
    }
  } else {
    backgroundBuffer = await generateFallbackBackground(data.scoreColor);
  }

  const overlaySvg = createTextOverlaySvg(data);
  const overlayBuffer = Buffer.from(overlaySvg);

  const result = await sharp(backgroundBuffer)
    .resize(WIDTH, HEIGHT, { fit: 'cover' })
    .composite([
      {
        input: overlayBuffer,
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}
