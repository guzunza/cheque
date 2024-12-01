const express = require('express');
    const bodyParser = require('body-parser');
    const db = require('./db/connection');  // Certifique-se de que o caminho para o banco de dados está correto
    const path = require('path');
    const cors = require('cors');
    const chequeRoutes = require('./routes/cheque');
    const bcrypt = require('bcrypt');
    const session = require('express-session'); 
    const moment = require('moment');

    const app = express();
    const PORT = 5002;


    // Configuração de sessão
    app.use(session({
    secret: 'segredo-super-seguro',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
const dayjs = require('dayjs');
let dataAtual = dayjs().format('YYYY-MM-DD');
console.log(dataAtual);

app.use(cors({
    origin: 'https://sistemaneobh.com.br', // Permite que apenas esse domínio acesse a API
}));

    app.use(express.json());
    app.use(express.static('public'));

    app.use(bodyParser.json());
    app.use(express.static(path.join(__dirname, 'frontend')));
    app.use('/api', chequeRoutes); // Rota para as APIs de cheques
    
    app.get('/favicon.ico', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'logoneo.png'));  // Caminho para o favicon
    });
    

  // Rota para cadastrar um cheque
  app.post('/api/cheques/cadastrocheque', async (req, res) => {
    const { cheque_numero, data_emissao, nome_beneficiario, valor, data_vencimento, descricao, empresa } = req.body;

    if (!cheque_numero || !data_emissao || !nome_beneficiario || !valor || !data_vencimento || !empresa) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try {
        const checkQuery = 'SELECT * FROM cheques WHERE cheque_numero = $1';
        const checkResult = await db.query(checkQuery, [cheque_numero]);

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ error: 'Já existe um cheque com este número.' });
        }

        const sql = `
            INSERT INTO cheques (cheque_numero, data_emissao, nome_beneficiario, valor, data_vencimento, descricao, empresa, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pendente')
        `;
        await db.query(sql, [cheque_numero, data_emissao, nome_beneficiario, valor, data_vencimento, descricao, empresa]);
        res.status(200).json({ message: 'Cheque cadastrado com sucesso!' });
    } catch (error) {
        console.error('Erro ao cadastrar cheque:', error);
        res.status(500).json({ error: 'Erro ao cadastrar cheque no banco de dados.' });
    }
});
       
// Marcar cheque como compensado ele sai de PRÓXIMOS CHEQUES A VENCER
app.patch('/api/cheques/compensar/:numero', async (req, res) => {
    const chequeNumero = req.params.numero;

    try {
        const sql = 'UPDATE cheques SET status = $1 WHERE cheque_numero = $2';
        const result = await db.query(sql, ['Compensado', chequeNumero]);

        if (result.rowCount > 0) {
            res.json({ success: true, message: 'Cheque marcado como compensado com sucesso!' });
        } else {
            res.status(404).json({ success: false, message: 'Cheque não encontrado.' });
        }
    } catch (error) {
        console.error('Erro ao atualizar status do cheque:', error);
        res.status(500).json({ success: false, message: 'Erro ao marcar cheque como compensado.' });
    }
});

// Rota para atualizar o status do cheque
app.patch('/api/cheques/atualizar-status/:numero', (req, res) => {
    const chequeNumero = req.params.numero;
    const { status } = req.body;  // O status pode ser "Atrasado", "Compensado", etc.

    const sql = `UPDATE cheques SET status = ? WHERE cheque_numero = ?`;

    db.query(sql, [status, chequeNumero], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar o status do cheque:', err);
            return res.status(500).json({ success: false, message: 'Erro ao atualizar status do cheque.' });
        }

        if (results.affectedRows > 0) {
            res.json({ success: true, message: `Cheque atualizado para ${status} com sucesso!` });
        } else {
            res.status(404).json({ success: false, message: 'Cheque não encontrado.' });
        }
    });
});


    app.get('/ping', (req, res) => {
        res.send('Servidor está funcionando');
    });

    // Rota para buscar um produto específico pelo ID ou Nome
    app.get('/api/produtos/:idOrNome', (req, res) => {
        const { idOrNome } = req.params;

        let sql = '';
        let values = [];

        // Verifica se o parâmetro é um número (ID) ou um texto (Nome)
        if (isNaN(idOrNome)) {
            // Se for texto, pesquisa pelo nome do produto
            sql = 'SELECT * FROM produtos WHERE nome = ?';
            values = [idOrNome];
        } else {
            // Se for um número, pesquisa pelo ID do produto
            sql = 'SELECT * FROM produtos WHERE id = ?';
            values = [parseInt(idOrNome)];
        }

        db.query(sql, values, (err, results) => {
            if (err) {
                console.error('Erro ao buscar produto:', err);
                res.status(500).json({ error: 'Erro ao buscar produto' });
                return;
            }

            if (results.length > 0) {
                res.json(results[0]);  // Retorna o primeiro produto encontrado
            } else {
                res.status(404).json({ message: 'Produto não encontrado' });
            }
        });
    });

    // Rota para listar todos os produtos no estoque
    
// Carrega os produtos ao iniciar a página
    app.get('/api/produtos', (req, res) => {
        console.log('Rota /api/produtos foi chamada'); // Verificação

        const sql = 'SELECT * FROM produtos';
        db.query(sql, (err, results) => {
            if (err) {
                console.error('Erro ao buscar produtos:', err);
                res.status(500).json({ error: 'Erro ao buscar produtos' });
                return;
            }
            res.json(results); // Retorna todos os produtos encontrados
        });
    });

    app.post('/api/produtos', (req, res) => {
        const { nome, descricao, quantidade, preco } = req.body;
    
        // Verifica se os campos obrigatórios foram preenchidos
        if (!nome || !quantidade || !preco) {
            return res.status(400).json({ error: 'Os campos Nome, Quantidade e Preço são obrigatórios.' });
        }
    
        // Insere o produto no banco de dados
        const sql = `
            INSERT INTO produtos (nome, descricao, quantidade, preco, data_cadastro) 
            VALUES (?, ?, ?, ?, NOW())
        `;
        const values = [nome, descricao, quantidade, preco];
    
        db.query(sql, values, (err, results) => {
            if (err) {
                console.error('Erro ao cadastrar produto:', err);
                res.status(500).json({ error: 'Erro ao cadastrar produto.' });
                return;
            }
            res.status(201).json({ message: 'Produto cadastrado com sucesso!' });
        });
    });

    
// Rota para consultar cheques por data de vencimento
app.get('/api/cheques/buscar-por-vencimento', async (req, res) => {
    const { dataVencimento } = req.query;

    if (!dataVencimento) {
        return res.status(400).json({ error: 'Por favor, forneça uma data de vencimento.' });
    }

    try {
        const sql = 'SELECT * FROM cheques WHERE DATE(data_vencimento) = $1';
        const { rows } = await db.query(sql, [dataVencimento]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao consultar cheques:', error);
        res.status(500).json({ error: 'Erro ao consultar cheques.' });
    }
});
   
   

app.get('/api/cheques/relatorio', (req, res) => {
    const { dataInicio, dataFim } = req.query;

    // Validações básicas para as datas
    if (!dataInicio || !dataFim) {
        return res.status(400).json({ success: false, message: 'Datas de início e fim são obrigatórias.' });
    }

    // Converter as datas para o formato Date (em caso de precisar de comparação no banco)
    const dataInicioDate = new Date(dataInicio);
    const dataFimDate = new Date(dataFim);

    // Verificar se as datas são válidas
    if (isNaN(dataInicioDate.getTime()) || isNaN(dataFimDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Datas fornecidas são inválidas.' });
    }

    // Construir a consulta SQL
    const query = `
        SELECT * FROM cheques
        WHERE data_emissao >= $1 AND data_emissao <= $2
    `;
    const values = [dataInicioDate, dataFimDate];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Erro ao consultar cheques:', err);
            return res.status(500).json({ success: false, message: 'Erro ao consultar cheques.' });
        }

        if (results.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Nenhum cheque encontrado para o intervalo de datas informado.' });
        }

        res.json({ success: true, cheques: results.rows });
         });
});
    
    /* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
    const boletoRoutes = require('./routes/boleto');  // Certifique-se de que o arquivo de rotas de cheque está configurado corretamente
    app.use('/api', boletoRoutes);

    // Rota para cadastrar um boleto
// Rota para cadastrar um boleto
app.post('/api/boletos/cadastroboleto', (req, res) => {
    const { nome_pagador, cpf_pagador, endereco_pagador, valor, data_emissao, data_vencimento, descricao } = req.body;

    // Verifica se a data de vencimento é anterior ao dia de hoje
    const dataVencimento = new Date(data_vencimento);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera as horas, minutos, segundos e milissegundos para a comparação apenas por data

    // Verifica se a data de emissão é posterior à data de vencimento
    if (new Date(data_emissao) > dataVencimento) {
        return res.status(400).json({ error: 'A data de emissão não pode ser posterior à data de vencimento.' });
    }

    // Define o status do boleto
    let status = "pendente";
    if (dataVencimento < hoje) {
        status = "atrasado";
    }

    // Adiciona o status na consulta SQL e nos valores
    const sql = 'INSERT INTO boletos (nome_pagador, cpf_pagador, endereco_pagador, valor, data_emissao, data_vencimento, descricao, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [nome_pagador, cpf_pagador, endereco_pagador, valor, data_emissao, data_vencimento, descricao, status];

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Erro ao cadastrar boleto:', err);
            res.status(500).json({ error: 'Erro ao cadastrar boleto' });
            return;
        }
        res.status(201).json({ message: 'Boleto cadastrado com sucesso!' });
    });
});


// Rota para buscar próximos boletos a vencer (a partir de hoje)
app.get('/api/boletos/proximos-boletos', (req, res) => {
    const hoje = new Date();
    const sql = 'SELECT * FROM boletos WHERE data_vencimento >= $1 ORDER BY data_vencimento ASC LIMIT 5';
    
    db.query(sql, [hoje], (err, result) => {
        if (err) {
            console.error('Erro ao buscar próximos boletos:', err);
            return res.status(500).json({ error: 'Erro ao carregar próximos boletos', details: err.message });
        }

        res.status(200).json(result.rows);
    });
});


app.get('/api/boletos/consultar-boleto-por-vencimento', (req, res) => {
    const { dataVencimento } = req.query;
    
    // Converte a data de vencimento para o formato ISO se necessário
    const dataFormatada = new Date(dataVencimento);
    
    // Verifica se a data é válida
    if (isNaN(dataFormatada)) {
        return res.status(400).json({ error: 'Data de vencimento inválida' });
    }

    // Consulta os boletos no banco com base na data de vencimento
    const sql = 'SELECT * FROM boletos WHERE data_vencimento = $1';
    
    db.query(sql, [dataFormatada], (err, results) => {
        if (err) {
            console.error('Erro ao consultar boletos:', err);
            res.status(500).json({ error: 'Erro ao consultar boletos' });
            return;
        }
        
        res.status(200).json(results.rows); // Retorna os resultados para o frontend
    });
});
app.patch('/api/boletos/pagar/:id', (req, res) => {
    const boletoId = req.params.id;

    // Verificar se o ID do boleto é um número válido
    if (isNaN(boletoId)) {
        return res.status(400).json({ success: false, message: 'ID do boleto inválido.' });
    }

    // Verificar se o boleto existe e atualizar seu status para "pago"
    const queryBuscar = 'SELECT * FROM boletos WHERE id = $1';
    const queryAtualizar = 'UPDATE boletos SET status = $1 WHERE id = $2';

    db.query(queryBuscar, [boletoId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar boleto:', err);
            return res.status(500).json({ success: false, message: 'Erro ao buscar o boleto.' });
        }

        if (results.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Boleto não encontrado.' });
        }

        const boleto = results.rows[0];

        if (boleto.status === 'pago') {
            return res.status(400).json({ success: false, message: 'Boleto já foi pago.' });
        }

        // Atualizar status para "pago"
        db.query(queryAtualizar, ['pago', boletoId], (err) => {
            if (err) {
                console.error('Erro ao atualizar o boleto:', err);
                return res.status(500).json({ success: false, message: 'Erro ao atualizar o boleto.' });
            }

            res.json({ success: true, message: 'Boleto marcado como pago com sucesso.' });
        });
    });
});



// Rota para checar se o servidor está online
app.get('/ping', (req, res) => {
    res.send('Servidor está funcionando');
});


// Serve arquivos estáticos do diretório 'frontend'
app.use(express.static(path.join(__dirname, '../frontend')));

// Rota padrão para carregar o arquivo principal (index.html ou cadastro.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/cadastro.html'));
});


// CHEQUE COMPENSADO
// Rota para marcar um cheque como compensado
app.patch('/api/cheques/compensar/:cheque_numero', (req, res) => {
    const chequeNumero = req.params.cheque_numero; // Use o número do cheque em vez do ID
    console.log("Cheque número recebido para compensação:", chequeNumero);

    const sql = `
        UPDATE cheques 
        SET status = 'Compensado' 
        WHERE cheque_numero = ?
    `;

    db.query(sql, [chequeNumero], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar status do cheque:', err);
            return res.status(500).json({ success: false, message: 'Erro ao atualizar status do cheque' });
        }

        if (results.affectedRows > 0) {
            res.json({ success: true, message: 'Cheque marcado como compensado' });
        } else {
            res.status(404).json({ success: false, message: 'Cheque não encontrado' });
        }
    });
});

// Rota para consultar boletos por data de vencimento
app.get('/api/boletos/consultar-boleto-por-vencimento', (req, res) => {
    const { dataVencimento } = req.query;

    if (!dataVencimento) {
        return res.status(400).json({ error: 'Data de vencimento é necessária.' });
    }

    // Consulta ao banco de dados para buscar os boletos pela data de vencimento
    const query = "SELECT * FROM boletos WHERE data_vencimento = ?";
    db.query(query, [dataVencimento], (err, results) => {
        if (err) {
            console.error('Erro ao consultar boletos:', err);
            return res.status(500).json({ error: 'Erro ao consultar boletos.' });
        }

        // Retorna os resultados para o frontend
        res.json(results);
    });
});
// Rota para consultar boletos por número
app.get('/api/boletos/consultar-boleto-por-numero', (req, res) => {
    const { numero_boleto } = req.query;
    
    const query = `SELECT * FROM boletos WHERE numero_boleto = ?`;
    
    connection.execute(query, [numero_boleto], (err, results) => {
        if (err) {
            console.error('Erro ao consultar boletos:', err);
            return res.status(500).json({ error: 'Erro ao consultar boletos.' });
        }
        
        res.status(200).json(results);
    });
});
// Rota para atualizar número do boleto
app.put('/api/boletos/atualizar-numero', (req, res) => {
    const { id, numero_boleto } = req.body;

    const query = `UPDATE boletos SET numero_boleto = ? WHERE id = ?`;

    connection.execute(query, [numero_boleto, id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar o número do boleto:', err);
            return res.status(500).json({ error: 'Erro ao atualizar o número do boleto.' });
        }

        res.status(200).json({ message: 'Número do boleto atualizado com sucesso!' });
    });
});



// Endpoint para login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios!' });
    }

    try {
        // Buscar o usuário no banco de dados
        const sql = 'SELECT * FROM clientes WHERE email = ?';
        const [rows] = await db.promise().execute(sql, [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Email ou senha incorretos!' });
        }

        const user = rows[0];

        // Comparar a senha fornecida com o hash armazenado no banco de dados
        const isValid = await bcrypt.compare(senha, user.senha);

        if (isValid) {
            // Salvar as informações do usuário na sessão
            req.session.user = {
                id: user.id,
                email: user.email,
                nome: user.nome,
            };

            return res.status(200).json({ message: 'Login realizado com sucesso!' });
        } else {
            return res.status(401).json({ message: 'Email ou senha incorretos!' });
        }
    } catch (err) {
        console.error('Erro ao autenticar usuário:', err);
        res.status(500).json({ message: 'Erro ao autenticar usuário.' });
    }
});


// Endpoint para cadastrar um novo cliente
app.post('/cadastrar', async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).send('Todos os campos são obrigatórios!');
    }

    try {
        // Verificar se o email já está cadastrado
        const checkEmail = 'SELECT * FROM clientes WHERE email = ?';
        const [existingUser] = await db.promise().execute(checkEmail, [email]);

        if (existingUser.length > 0) {
            return res.status(400).send('Email já cadastrado!');
        }

        // Gerar o hash da senha
        const hashedPassword = await bcrypt.hash(senha, 10);

        // Inserir o novo cliente no banco de dados
        const sql = `INSERT INTO clientes (nome, email, senha) VALUES (?, ?, ?)`;
        await db.promise().execute(sql, [nome, email, hashedPassword]);

        res.status(201).send('Cadastro realizado com sucesso!');
    } catch (err) {
        console.error('Erro ao cadastrar cliente:', err);
        res.status(500).send('Erro ao cadastrar cliente.');
    }
});

// Nova rota para consultar todos os boletos sem filtro de data
app.get('/api/boletos/consultar-todos', (req, res) => {
    const query = "SELECT * FROM boletos";  // Consulta todos os boletos

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao consultar boletos:', err);
            return res.status(500).json({ error: 'Erro ao consultar boletos' });
        }

        res.json(results);  // Retorna todos os boletos
    });
});

// Nova rota para consultar boletos por status
app.get('/api/boletos/consultar-por-status', (req, res) => {
    const { status } = req.query;

    // Se o status for "todos", então buscamos todos os boletos, sem filtro
    const query = status === 'todos' 
        ? 'SELECT * FROM boletos' 
        : 'SELECT * FROM boletos WHERE status = $1';

    // Se o status não for "todos", passamos o status na query SQL
    const queryParams = status === 'todos' ? [] : [status];

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Erro ao consultar boletos:', err);
            return res.status(500).json({ success: false, message: 'Erro ao consultar boletos.' });
        }

        if (results.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Nenhum boleto encontrado.' });
        }

        res.json({ success: true, boletos: results.rows });
    });
});



// Rota para deletar um boleto
app.delete('/api/boletos/deletar/:id', (req, res) => {
    const { id } = req.params;  // Obtém o ID do boleto da URL

    // Consulta para excluir o boleto
    const query = "DELETE FROM boletos WHERE id = ?";
    
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Erro ao excluir o boleto:', err);
            return res.status(500).json({ error: 'Erro ao excluir o boleto' });
        }

        if (results.affectedRows > 0) {
            res.json({ success: true, message: 'Boleto excluído com sucesso.' });
        } else {
            res.status(404).json({ error: 'Boleto não encontrado.' });
        }
    });
});

// No seu servidor Node.js (Express)
app.get('/api/boletos/boletos', (req, res) => {
    const id = req.query.id;  // Recupera o parâmetro id da query string

    if (!id) {
        return res.status(400).json({ message: 'ID do boleto não fornecido' });
    }

    // Código para buscar o boleto no banco de dados (exemplo com MySQL)
    db.query('SELECT * FROM boletos WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erro no servidor' });
        }
        if (result.length > 0) {
            res.json(result[0]);  // Retorna o primeiro boleto encontrado
        } else {
            res.status(404).json({ message: 'Boleto não encontrado' });
        }
    });
});

app.put('/api/boletos/boletos/:id', (req, res) => {
    const id = req.params.id;  // Pega o ID do boleto da URL
    const { nome_pagador, cpf_pagador, endereco_pagador, valor, data_emissao, data_vencimento, descricao, status } = req.body;

    // Validação e lógica para atualizar o boleto no banco de dados
    db.query(
        'UPDATE boletos SET nome_pagador = ?, cpf_pagador = ?, endereco_pagador = ?, valor = ?, data_emissao = ?, data_vencimento = ?, descricao = ?, status = ? WHERE id = ?',
        [nome_pagador, cpf_pagador, endereco_pagador, valor, data_emissao, data_vencimento, descricao, status, id],
        (err, result) => {
            if (err) {
                console.error('Erro ao atualizar boleto:', err);
                return res.status(500).json({ message: 'Erro ao atualizar o boleto.' });
            }
            if (result.affectedRows > 0) {
                res.json({ success: true, message: 'Boleto atualizado com sucesso.' });
            } else {
                res.status(404).json({ message: 'Boleto não encontrado.' });
            }
        }
    );
});

// Inserir um cheque - ao cadastrar, o status será 'Pendente'
app.post('/api/cheques', (req, res) => {
    const { cheque_numero, empresa, nome_beneficiario, data_vencimento, valor } = req.body;

    if (!cheque_numero || !empresa || !nome_beneficiario || !data_vencimento || !valor) {
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios' });
    }

    const sql = `
        INSERT INTO cheques (cheque_numero, empresa, nome_beneficiario, data_vencimento, valor, status)
        VALUES (?, ?, ?, ?, ?, 'Pendente')
    `;
    
    db.query(sql, [cheque_numero, empresa, nome_beneficiario, data_vencimento, valor], (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar cheque:', err);
            return res.status(500).json({ success: false, message: 'Erro ao cadastrar cheque' });
        }
        res.status(201).json({ success: true, message: 'Cheque cadastrado com sucesso' });
    });
});


// Listar cheques próximos ao vencimento
app.get('/api/cheques/proximos', async (req, res) => {
    try {
        const amanhaInicio = moment().add(1, 'days').startOf('day').toISOString();
        const amanhaFim = moment().add(1, 'days').endOf('day').toISOString();

        console.log('Datas para próximos cheques:', { amanhaInicio, amanhaFim });

        const sql = `
            SELECT * FROM cheques
            WHERE status = 'Pendente'
              AND data_vencimento >= $1
              AND data_vencimento <= $2
            ORDER BY data_vencimento ASC
        `;

        const { rows } = await db.query(sql, [amanhaInicio, amanhaFim]);
        res.status(200).json({ success: true, cheques: rows });
    } catch (error) {
        console.error('Erro ao carregar próximos cheques:', error);
        res.status(500).json({ success: false, message: 'Erro ao carregar próximos cheques', error: error.message });
    }
});


// Marcar cheque como compensado
app.post('/api/cheques/marcar-compensado', (req, res) => {
    const { cheque_numero } = req.body;

    const sql = `UPDATE cheques SET status = 'Compensado' WHERE cheque_numero = ?`;
    
    db.query(sql, [cheque_numero], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erro ao marcar cheque como compensado' });
        }

        res.status(200).json({ success: true, message: 'Cheque marcado como compensado' });
    });
});



module.exports = app;
