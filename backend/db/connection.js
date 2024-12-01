const mysql = require('mysql2');

// Função para criar uma conexão com o banco
function createConnection() {
    return mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'Toby@2020',
        database: process.env.DB_NAME || 'sistema_cheques',
        port: process.env.DB_PORT || 3306,
    });
}

// Manter a conexão ativa com reconexão automática
function handleDisconnect(connection) {
    connection.connect((err) => {
        if (err) {
            console.error('Erro ao conectar ao banco de dados:', err);
            setTimeout(() => handleDisconnect(connection), 2000); // Tentar reconectar após 2 segundos
        } else {
            console.log('Conexão com o banco de dados bem-sucedida!');
        }
    });

    connection.on('error', (err) => {
        console.error('Erro na conexão do banco de dados:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('Reconectando ao banco de dados...');
            handleDisconnect(createConnection()); // Reconectar ao perder a conexão
        } else {
            throw err; // Outros erros não são recuperáveis
        }
    });
}

// Criar e gerenciar a conexão
const connection = createConnection();
handleDisconnect(connection);

module.exports = connection;
