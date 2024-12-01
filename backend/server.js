const express = require('express');
const cors = require('cors');
const connection = require('./db/connection');

const app = require('./app'); 

const PORT = process.env.PORT || 5002;
// Definindo uma rota para testar a conexão com o banco de dados
app.get('/test', (req, res) => {
    connection.query('SELECT 1 + 1 AS resultado', (err, results) => {
        if (err) {
            res.status(500).send('Erro ao consultar o banco de dados: ' + err.message);
        } else {
            res.send('Conexão bem-sucedida! Resultado: ' + results[0].resultado);
        }
    });
});

// Iniciando o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});