const { Pool } = require('pg');

// Configuração da conexão com o PostgreSQL
const pool = new Pool({
  user: 'postgres', // Substitua pelo seu usuário do PostgreSQL
  host: '127.0.0.1',   // Substitua pelo host do banco de dados
  database: 'sistema_cheques', // Substitua pelo nome do banco de dados
  password: 'Toby@2020', // Substitua pela sua senha
  port: 5432,           // Porta padrão do PostgreSQL
});

// Teste da conexão
pool.connect((err, client, release) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.stack);
  } else {
    console.log('Conexão bem-sucedida ao PostgreSQL');
    release(); // Libera o cliente de volta para o pool
  }
});

module.exports = pool;
