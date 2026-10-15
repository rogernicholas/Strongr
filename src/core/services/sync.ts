export interface SyncService {
  /** Push and pull changes. Resolves when done; never throws for "offline". */
  sync(): Promise<void>;
}

/** Stub until cloud sync exists (deferred): does nothing. */
export const noopSyncService: SyncService = {
  async sync() {},
};
