const { Pool } = require('pg');

// Configuração da conexão ao banco de dados PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost', // Use o host do Render ou 'localhost'
    user: process.env.DB_USER || 'root',     // Use o usuário do Render ou 'root'
    password: process.env.DB_PASSWORD || 'UW8Vp8sfospFLIwJZm8A6LeTCpsK88G4', // Use a senha do Render
    database: process.env.DB_NAME || 'sistema_cheques_7oot', // Nome do banco
    port: process.env.DB_PORT || 5432,       // Porta padrão do PostgreSQL
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false // Habilitar SSL no Render
});

// Testando a conexão
(async () => {
    try {
        const client = await pool.connect();
        console.log('Conexão com o banco de dados PostgreSQL bem-sucedida!');
        client.release(); // Liberar a conexão
    } catch (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    }
})();

module.exports = pool;
