const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost', // Use DB_HOST do Render ou localhost
    user: process.env.DB_USER || 'root',     // Use DB_USER do Render ou 'root'
    password: process.env.DB_PASSWORD || 'Toby@2020', // Use DB_PASSWORD do Render ou sua senha
    database: process.env.DB_NAME || 'sistema_cheques', // Use DB_NAME do Render ou seu banco de dados
    port: process.env.DB_PORT || 3306  // Usar a porta do banco de dados, se necessário
});

connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('Conexão com o banco de dados bem-sucedida!');
    }
});

module.exports = connection;
