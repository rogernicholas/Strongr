import { localAuthService, type AuthService } from './auth';
import { unlockedEntitlementService, type EntitlementService } from './entitlements';
import { noopSyncService, type SyncService } from './sync';

export { track } from './analytics';
export type { AnalyticsProps } from './analytics';
export type { AuthService, User } from './auth';
export type { Entitlement, EntitlementService } from './entitlements';
export type { SyncService } from './sync';

/** Features call these instead of assuming a local-only app. Swap implementations here. */
export const services: {
  auth: AuthService;
  sync: SyncService;
  entitlements: EntitlementService;
} = {
  auth: localAuthService,
  sync: noopSyncService,
  entitlements: unlockedEntitlementService,
};
