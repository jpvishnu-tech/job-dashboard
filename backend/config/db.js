import mongoose from 'mongoose';

// ── Connection options tuned for MongoDB Atlas ────────────────────────────────
const ATLAS_OPTIONS = {
  maxPoolSize:              10,
  minPoolSize:               2,
  serverSelectionTimeoutMS:  8_000,
  connectTimeoutMS:         10_000,
  socketTimeoutMS:          45_000,
  heartbeatFrequencyMS:     10_000,
  family:                    4,     // force IPv4 — avoids DNS issues on some hosts
};

export default async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error(
      '[db] MONGO_URI is not set.\n' +
      '     Copy .env.example → .env and fill in your Atlas connection string.'
    );
    process.exit(1);
  }

  try {
    const { connection } = await mongoose.connect(uri, ATLAS_OPTIONS);
    console.log(`[db] MongoDB Atlas connected → ${connection.host} / ${connection.name}`);
  } catch (err) {
    console.error(`[db] Connection failed: ${err.message}`);

    if (process.env.NODE_ENV !== 'production') {
      console.error(
        '\n  Troubleshooting:\n' +
        '  1. IP whitelist  → Atlas dashboard → Network Access → Add your IP\n' +
        '  2. Credentials   → check username / password in MONGO_URI\n' +
        '  3. Cluster name  → verify the hostname in the connection string\n' +
        '  4. Free tier     → ensure the cluster is not paused\n'
      );
    }

    process.exit(1);
  }
}

mongoose.connection.on('error',        (err) => console.error('[db] Error:', err.message));
mongoose.connection.on('disconnected', ()    => console.warn('[db]  Disconnected — reconnecting…'));
mongoose.connection.on('reconnected',  ()    => console.log('[db]  Reconnected to Atlas'));
