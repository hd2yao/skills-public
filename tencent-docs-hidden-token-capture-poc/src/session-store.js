export function createSessionStore({ now = () => new Date().toISOString() } = {}) {
  const sessions = new Map();

  return {
    createSession({ id, loginUrl }) {
      const timestamp = now();
      const session = {
        id,
        status: "waiting_login",
        loginUrl,
        tokenLast4: null,
        error: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      sessions.set(id, session);
      return { ...session };
    },

    getSession(id) {
      const session = sessions.get(id);
      return session ? { ...session } : null;
    },

    updateSession(id, patch) {
      const existing = sessions.get(id);
      if (!existing) {
        return null;
      }

      const updated = {
        ...existing,
        ...patch,
        updatedAt: now(),
      };

      sessions.set(id, updated);
      return { ...updated };
    },
  };
}
