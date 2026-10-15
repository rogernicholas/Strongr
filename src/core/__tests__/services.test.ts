import { services, track } from '@/core/services';

describe('service stubs', () => {
  it('has a single local user, everything unlocked, and no-op sync and analytics', async () => {
    expect(await services.auth.getCurrentUser()).toMatchObject({ id: 'local', isLocal: true });
    expect(await services.entitlements.has('pro')).toBe(true);
    await expect(services.sync.sync()).resolves.toBeUndefined();
    expect(() => track('test_event', { a: 1 })).not.toThrow();
  });
});
