// models/Cheque.js
const db = require('../db/connection');

// Função para cadastrar um novo cheque
const cadastrarBoleto = (nome_pagador, cpf_pagador, endereco_pagador, valor, data_emissao, data_vencimento, descricao, status, callback) => {
  const sql = `
    INSERT INTO boletos (nome_pagador, cpf_pagador, endereco_pagador, valor, data_emissao, data_vencimento, descricao, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
 
  db.query(sql, [nome_pagador,cpf_pagador, endereco_pagador, valor, data_emissao, data_vencimento, descricao, status], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  });
};


// Função para listar todos os boletos
const listarBoletos = (callback) => {
  const sql = 'SELECT * FROM boletos';
 
  db.query(sql, (err, results) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, results);
  });
};


module.exports = { cadastrarBoleto, listarBoletos };