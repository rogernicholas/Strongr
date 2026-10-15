export interface User {
  id: string;
  displayName: string;
  isLocal: boolean;
}

export interface AuthService {
  getCurrentUser(): Promise<User>;
}

/** Stub until accounts exist (deferred): there is exactly one local user. */
export const localAuthService: AuthService = {
  async getCurrentUser() {
    return { id: 'local', displayName: 'Me', isLocal: true };
  },
};
