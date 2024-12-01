const express = require('express');
const router = express.Router();
const db = require('../db/connection');


// Rota para consultar boletos que vencem no dia seguinte
router.get('/proximos-boletos', (req, res) => {
    const query = `
        SELECT nome_pagador, cpf_pagador, endereco_pagador, valor, data_emissao, data_vencimento, descricao, status
        FROM boletos 
        WHERE data_vencimento = CURDATE() + INTERVAL 1 DAY
    `;
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao consultar boletos.', error: err });
        }
        res.json(results);
    });
});


router.post('/cadastroboleto', (req, res) => {
    const { nome_pagador, cpf_pagador, endereco_pagador,  valor, data_emissao, data_vencimento, descricao, status } = req.body;

    const query = 'INSERT INTO boleto (nome_pagador, cpf_pagador, endereco_pagador, valor, data_emissao, data_vencimento, descricao, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [nome_pagador, cpf_pagador, endereco_pagador, valor, data_emissao, data_vencimento, descricao, status], (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar Boleto:', err);
            res.status(500).json({ error: 'Erro ao cadastrar Boleto' });
        } else {
            res.status(201).json({ message: 'Boleto cadastrado com sucesso!' });
        }
    });
});

//Consultar
// Rota para consultar boletos
router.get('/boletos', (req, res) => {
    const status = req.query.status; // Filtra pelo status se fornecido
    let sql = 'nome_pagador, cpf_pagador, endereco_pagador, valor, data_emissao, data_vencimento, descricao, status';

    // Adiciona a condição para o status, se fornecido
    if (status && status !== 'todos') {
        sql += ` WHERE status = ?`;
    }

    db.query(sql, [status], (err, results) => {
        if (err) {
            console.error('Erro ao buscar boletos:', err);
            return res.status(500).json({ error: 'Erro ao buscar boletos' });
        }
        res.json(results); // Inclui o campo "id" nos resultados
    });
});

// Rota para excluir um cheque
router.delete('/boletos/:id', (req, res) => {
    const boletoId = req.params.id; // Obtém o id do cheque a ser excluído

    const query = 'DELETE FROM boletos WHERE id = ?';

    db.query(query, [boletoId], (err, result) => {
        if (err) {
            console.error('Erro ao excluir boleto:', err);
            return res.status(500).json({ error: 'Erro ao excluir boleto' });
        }

        // Verifica se algum boleto foi excluído
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'boleto não encontrado' });
        }

        res.status(200).json({ message: 'boleto excluído com sucesso!' });
    });
});

// Rota para editar um cheque
router.put('/boletos/:id', (req, res) => {
    const id = req.params.id;
    const { nome_pagador, cpf_pagador, endereco_pagador, valor, data_emissao, data_vencimento, descricao, status } = req.body;

    const query = `
        UPDATE boletos
        SET nome_pagador = ?, cpf_pagador = ?, endereco_pagador = ?, valor = ?, data_emissao = ?, data_vencimento = ?, descricao = ?, status = ?
        WHERE id = ?
    `;
    db.query(query, [nome_pagador, cpf_pagador, endereco_pagador, valor, data_emissao, data_vencimento, descricao, status], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar Boleto:', err);
            return res.status(500).json({ error: 'Erro ao atualizar Boleto' });
        }
        res.status(200).json({ message: 'Boleto atualizado com sucesso!' });
    });
});


// Exemplo de código para atualizar o status de um cheque para "compensado"
router.put('/compensar/:id', (req, res) => {
    const boletoId = req.params.id;  // Pegando o ID do cheque da URL
    const novoStatus = 'compensado';  // Novo status que queremos definir

    // Query para atualizar o status no banco de dados
    const query = 'UPDATE boletos SET status = ? WHERE id = ?';
    
    connection.query(query, [novoStatus, boletoId], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar o status do boleto:', err);
            return res.status(500).json({ success: false, message: 'Erro ao atualizar o status do boleto.' });
        }

        if (result.affectedRows > 0) {
            // Se o status foi atualizado com sucesso
            res.status(200).json({ success: true, message: 'Status do boleto atualizado para compensado.' });
        } else {
            // Caso o cheque não tenha sido encontrado
            res.status(404).json({ success: false, message: 'boleto não encontrado.' });
        }
    });
});



router.patch('/compensar/:id', (req, res) => {
    const boletoId = req.params.id;

    const sql = `
        UPDATE boletos 
        SET status = 'Compensado' 
        WHERE id = ?
    `;

    db.query(sql, [boletoId], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erro ao atualizar status do boleto', error: err });
        }

        if (results.affectedRows > 0) {
            res.json({ success: true, message: 'Boleto marcado como compensado' });
        } else {
            res.status(404).json({ success: false, message: 'Boleto não encontrado' });
        }
    });
});




module.exports = router;