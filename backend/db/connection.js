const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  user: 'sistema_cheques_3pno_user',        // Usuário do banco
  host: 'dpg-ct66a156147c738027d0-a',      // Host do banco (Render)
  database: 'sistema_cheques_3pno',        // Nome do banco
  password: 'g8lYOUIMXATqWgDOzToCAaBhs5Yn4g6', // Senha do banco
  port: 5432,                              // Porta padrão do PostgreSQL
  ssl: {
    rejectUnauthorized: false,             // Necessário para conexões seguras
  },
});

// Testando a conexão
pool.connect()
  .then(() => console.log('Conexão com o banco de dados bem-sucedida!'))
  .catch((err) => console.error('Erro ao conectar ao banco de dados:', err.stack));
