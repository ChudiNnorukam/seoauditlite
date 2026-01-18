import type { RequestHandler } from '@sveltejs/kit';
import { ImageResponse } from '@vercel/og';
import { getAudit } from '$lib/server/audit-store';
import { extractAuditImageData } from '$lib/image-generation/templates';

export const GET: RequestHandler = async ({ params }): Promise<Response> => {
  const { auditId } = params;

  if (!auditId) {
    return new Response('Missing audit ID', { status: 400 });
  }

  // Fetch the audit data
  const audit = await getAudit(auditId);
  if (!audit) {
    return new Response('Audit not found', { status: 404 });
  }

  // Extract data needed for the image
  const data = extractAuditImageData(audit);

  // Color mapping
  const colors = {
    green: { primary: '#16a34a', bg: '#dcfce7', light: '#f0fdf4' },
    amber: { primary: '#ca8a04', bg: '#fef3c7', light: '#fffbeb' },
    red: { primary: '#dc2626', bg: '#fee2e2', light: '#fef2f2' },
  };

  const color = colors[data.scoreColor];

  try {
    const response = new ImageResponse(
      {
        type: 'div',
        props: {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: color.light,
            fontFamily: 'system-ui, sans-serif',
          },
          children: {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '60px',
                padding: '60px',
                backgroundColor: 'white',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
              },
              children: [
                // Score ring
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '180px',
                      height: '180px',
                      borderRadius: '50%',
                      border: `12px solid ${color.bg}`,
                      borderTopColor: color.primary,
                      borderRightColor: data.score >= 25 ? color.primary : color.bg,
                      borderBottomColor: data.score >= 50 ? color.primary : color.bg,
                      borderLeftColor: data.score >= 75 ? color.primary : color.bg,
                    },
                    children: [
                      {
                        type: 'span',
                        props: {
                          style: {
                            fontSize: '56px',
                            fontWeight: 700,
                            color: color.primary,
                          },
                          children: String(data.score),
                        },
                      },
                      {
                        type: 'span',
                        props: {
                          style: {
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#64748b',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                          },
                          children: 'SCORE',
                        },
                      },
                    ],
                  },
                },
                // Right side content
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    },
                    children: [
                      // Domain
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '42px',
                            fontWeight: 700,
                            color: '#0f172a',
                            letterSpacing: '-0.02em',
                          },
                          children: data.domain.length > 25 ? data.domain.substring(0, 22) + '...' : data.domain,
                        },
                      },
                      // Subtitle
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '20px',
                            color: '#64748b',
                          },
                          children: 'AI Engine Optimization Audit',
                        },
                      },
                      // Status badges
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            gap: '12px',
                            marginTop: '8px',
                          },
                          children: [
                            // Pass badge
                            {
                              type: 'div',
                              props: {
                                style: {
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '8px 16px',
                                  backgroundColor: '#dcfce7',
                                  borderRadius: '8px',
                                },
                                children: [
                                  { type: 'span', props: { style: { color: '#16a34a', fontSize: '18px' }, children: '✓' } },
                                  { type: 'span', props: { style: { color: '#16a34a', fontWeight: 600, fontSize: '16px' }, children: String(data.passes) } },
                                ],
                              },
                            },
                            // Warning badge
                            {
                              type: 'div',
                              props: {
                                style: {
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '8px 16px',
                                  backgroundColor: '#fef3c7',
                                  borderRadius: '8px',
                                },
                                children: [
                                  { type: 'span', props: { style: { color: '#ca8a04', fontSize: '18px' }, children: '!' } },
                                  { type: 'span', props: { style: { color: '#ca8a04', fontWeight: 600, fontSize: '16px' }, children: String(data.warnings) } },
                                ],
                              },
                            },
                            // Fail badge
                            {
                              type: 'div',
                              props: {
                                style: {
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '8px 16px',
                                  backgroundColor: '#fee2e2',
                                  borderRadius: '8px',
                                },
                                children: [
                                  { type: 'span', props: { style: { color: '#dc2626', fontSize: '18px' }, children: '✕' } },
                                  { type: 'span', props: { style: { color: '#dc2626', fontWeight: 600, fontSize: '16px' }, children: String(data.fails) } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      // Grade badge
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '8px',
                          },
                          children: {
                            type: 'div',
                            props: {
                              style: {
                                padding: '8px 20px',
                                backgroundColor: color.primary,
                                borderRadius: '8px',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '18px',
                              },
                              children: `Grade ${data.grade}`,
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
      {
        width: 1200,
        height: 630,
      }
    );

    // Add caching headers
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    response.headers.set('CDN-Cache-Control', 'public, max-age=86400');

    return response;
  } catch (error) {
    console.error('Failed to generate OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
};
