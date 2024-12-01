// models/Cheque.js
const db = require('../db/connection');

// Função para cadastrar um novo cheque
const cadastrarCheque = (cheque_numero, data_emissao, nome_beneficiario, valor, data_vencimento, descricao, callback) => {
  const sql = `
    INSERT INTO cheques (cheque_numero, data_emissao, nome_beneficiario, valor, data_vencimento, descricao)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
 
  db.query(sql, [cheque_numero, data_emissao, nome_beneficiario, valor, data_vencimento, descricao], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  });
};


// Função para listar todos os cheques
const listarCheques = (callback) => {
  const sql = 'SELECT * FROM cheques';
 
  db.query(sql, (err, results) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, results);
  });
};


module.exports = { cadastrarCheque, listarCheques, listarChequesPorData };