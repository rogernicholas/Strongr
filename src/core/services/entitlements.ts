export type Entitlement = 'pro';

export interface EntitlementService {
  has(entitlement: Entitlement): Promise<boolean>;
}

/** Stub until payments exist (deferred): everything is unlocked. */
export const unlockedEntitlementService: EntitlementService = {
  async has() {
    return true;
  },
};
