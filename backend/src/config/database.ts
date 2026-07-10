import mongoose from 'mongoose';

// Reutiliza a conexão entre chamadas serverless (Vercel)
let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI não está definida nas variáveis de ambiente.');

  try {
    await mongoose.connect(uri, {
      bufferCommands: false,
      family: 4,                      // Força IPv4 — resolve ECONNREFUSED em redes corporativas
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log('✓ MongoDB conectado');
  } catch (err) {
    console.error('✗ Falha ao conectar ao MongoDB:', err);
    throw err;
  }
}
