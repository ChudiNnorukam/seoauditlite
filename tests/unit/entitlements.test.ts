import { describe, it, expect } from 'vitest';
import { resolveEntitlements } from '$lib/auditing/resolve-entitlements';

describe('resolveEntitlements', () => {
  it('should default to free plan when no override', () => {
    const result = resolveEntitlements({
      audit: null,
      isShareLink: false,
      isOwner: true,
    });

    expect(result.plan).toBe('free');
    expect(result.isOwner).toBe(true);
    expect(result.isShareLink).toBe(false);
  });

  it('should use planOverride when provided', () => {
    const result = resolveEntitlements({
      audit: null,
      isShareLink: false,
      isOwner: true,
      planOverride: 'pro',
    });

    expect(result.plan).toBe('pro');
  });

  it('should mark share links correctly', () => {
    const result = resolveEntitlements({
      audit: null,
      isShareLink: true,
      isOwner: false,
    });

    expect(result.isShareLink).toBe(true);
    expect(result.isOwner).toBe(false);
  });

  it('should override isShareLink to false when owner', () => {
    // When viewing your own audit via share link, isShareLink becomes false
    const result = resolveEntitlements({
      audit: null,
      isShareLink: true,
      isOwner: true,
      planOverride: 'pro',
    });

    // Owner viewing via share link should NOT be treated as share link
    expect(result.isShareLink).toBe(false);
    expect(result.isOwner).toBe(true);
    expect(result.plan).toBe('pro');
  });
});
