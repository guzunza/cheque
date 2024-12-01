const { Pool } = require('pg');

// Configuração da conexão com o PostgreSQL usando variáveis de ambiente ou valores padrão
const pool = new Pool({
  user: process.env.DB_USER || 'postgres', // Substitua pelo seu usuário do PostgreSQL
  host: process.env.DB_HOST || '127.0.0.1', // Substitua pelo host do banco de dados
  database: process.env.DB_NAME || 'sistema_cheques', // Substitua pelo nome do banco de dados
  password: process.env.DB_PASSWORD || 'Toby@2020', // Substitua pela sua senha
  port: process.env.DB_PORT || 5432, // Porta padrão do PostgreSQL
});

// Teste de conexão inicial
(async () => {
  try {
    const client = await pool.connect();
    console.log('Conexão bem-sucedida ao PostgreSQL');
    client.release(); // Libera o cliente de volta ao pool
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    process.exit(1); // Encerra o processo se a conexão falhar
  }
})();

// Exporta o pool para uso em outras partes do projeto
module.exports = pool;
