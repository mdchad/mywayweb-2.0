// TODO(port): replace with the real Better Auth client (wired to Turso) when
// the auth surfaces (/login, /register, admin) are ported over. Until then
// this stub keeps the Navbar rendering its signed-out state without firing
// requests at auth endpoints that don't exist yet.

type SessionState = {
  data: null;
  isPending: boolean;
  error: null;
  refetch: () => void;
};

export const authClient = {
  useSession(): SessionState {
    return { data: null, isPending: false, error: null, refetch: () => {} };
  },
  async signOut(_opts?: unknown) {
    return { data: null, error: null };
  },
};
