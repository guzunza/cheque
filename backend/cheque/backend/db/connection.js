const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Usuário MySQL
    password: '', // Ou sua senha 
    database: 'sistema_cheques', // Nome do banco
    port: 3306 // Porta configurada no MySQL/XAMPP
});

connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('Conexão com o banco de dados bem-sucedida!');
    }
});

module.exports = connection;
