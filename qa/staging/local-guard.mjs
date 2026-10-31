// Mutating fixtures must never accept a hosted project or a caller-selected DB.
export function localStatus(status) {
 if (status.API_URL !== 'http://127.0.0.1:54321') throw new Error('Isolated API must be 127.0.0.1:54321');
 const db = new URL(status.DB_URL);
 if (db.protocol !== 'postgresql:' || db.hostname !== '127.0.0.1' || db.port !== '54322' || db.pathname !== '/postgres' || db.username !== 'postgres' || db.search || db.hash) throw new Error('Isolated DB must be postgres on 127.0.0.1:54322');
 if (!status.ANON_KEY || !status.SERVICE_ROLE_KEY) throw new Error('Missing local Supabase keys');
 return status;
}
export const localAppURL = 'http://127.0.0.1:4179';
