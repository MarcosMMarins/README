import 'dotenv/config';
// Força IPv4 no resolver DNS — necessário em redes corporativas com DNS TCP bloqueado
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import app from './app';

// Usado apenas para desenvolvimento local — Vercel usa api/index.ts
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 Backend rodando em http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
