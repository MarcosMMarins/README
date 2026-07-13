import mongoose from 'mongoose';

// Memoiza a PROMISE de conexão (não um booleano) para que chamadas concorrentes
// no mesmo cold start (middleware + seed) aguardem a mesma tentativa de connect
// em vez de disparar mongoose.connect() em paralelo, o que corrompia o estado
// da conexão default do mongoose e causava falhas intermitentes.
let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  if (!connectionPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI não está definida nas variáveis de ambiente.');

    connectionPromise = mongoose
      .connect(uri, {
        bufferCommands: false,
        family: 4,                      // Força IPv4 — resolve ECONNREFUSED em redes corporativas
        serverSelectionTimeoutMS: 8000,
      })
      .then((m) => {
        console.log('✓ MongoDB conectado');
        return m;
      })
      .catch((err) => {
        connectionPromise = null;       // permite nova tentativa na próxima chamada
        console.error('✗ Falha ao conectar ao MongoDB:', err);
        throw err;
      });
  }

  await connectionPromise;
}
