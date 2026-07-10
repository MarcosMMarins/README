import { Usuario } from '../models/Usuario.model';

// Cria o primeiro usuário admin se o banco estiver vazio
export async function seedDatabase(): Promise<void> {
  const total = await Usuario.countDocuments();
  if (total > 0) return;

  await Usuario.create({
    nome: 'Administrador',
    email: 'admin@mobyweb.com.br',
    senha: 'admin@123',
    departamento: 'Tecnologia da Informação',
    cargo: 'Administrador do Sistema',
    role: 'admin',
    ativo: true,
  });

  console.log('✓ Seed: admin criado — admin@mobyweb.com.br / admin@123');
  console.log('  ⚠  Altere a senha do admin após o primeiro login!');
}
