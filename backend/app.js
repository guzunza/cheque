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

    app.use(bodyParser.json());
    app.use(express.static(path.join(__dirname, 'frontend')));
    app.use('/api', chequeRoutes); // Rota para as APIs de cheques
    

  // Rota para cadastrar um cheque
  app.post('/api/cheques/cadastrocheque', (req, res) => {
    const { cheque_numero, data_emissao, nome_beneficiario, valor, data_vencimento, descricao, empresa } = req.body;

    // Verifica se todos os campos obrigatórios foram preenchidos
    if (!cheque_numero || !data_emissao || !nome_beneficiario || !valor || !data_vencimento || !empresa) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    // Verificar se já existe um cheque com o mesmo número
    const checkQuery = 'SELECT * FROM cheques WHERE cheque_numero = ?';
    db.query(checkQuery, [cheque_numero], (err, results) => {
        if (err) {
            console.error('Erro ao verificar cheque:', err);
            return res.status(500).json({ error: 'Erro ao verificar cheque no banco de dados.' });
        }

        // Se já existir um cheque com o mesmo número, retorna um erro
        if (results.length > 0) {
            return res.status(400).json({ error: 'Já existe um cheque com este número.' });
        }

        // Se não existir, insere o novo cheque
        const sql = `INSERT INTO cheques (cheque_numero, data_emissao, nome_beneficiario, valor, data_vencimento, descricao, empresa) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;

        const values = [cheque_numero, data_emissao, nome_beneficiario, valor, data_vencimento, descricao, empresa];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Erro ao salvar cheque:', err);
                return res.status(500).json({ error: 'Erro ao salvar cheque no banco de dados.' });
            }
            res.status(200).json({ message: 'Cheque cadastrado com sucesso!' });
        });
    });
});
       
// Marcar cheque como compensado ele sai de PRÓXIMOS CHEQUES A VENCER
app.patch('/api/cheques/compensar/:numero', (req, res) => {
    const chequeNumero = req.params.numero;
    const sql = `UPDATE cheques SET status = 'Compensado' WHERE cheque_numero = ?`;

    db.query(sql, [chequeNumero], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar o status do cheque:', err);
            return res.status(500).json({ success: false, message: 'Erro ao marcar cheque como compensado.' });
        }

        if (results.affectedRows > 0) {
            res.json({ success: true, message: 'Cheque marcado como compensado com sucesso!' });
        } else {
            res.status(404).json({ success: false, message: 'Cheque não encontrado.' });
        }
    });
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
app.get('/api/cheques/buscar-por-vencimento', (req, res) => {
    const { dataVencimento } = req.query;

    if (!dataVencimento) {
        return res.status(400).json({ error: 'Por favor, forneça uma data de vencimento.' });
    }

    // Usando moment.js para garantir que a data esteja no formato correto
    const dataVencimentoFormatada = moment(dataVencimento, 'YYYY-MM-DD').format('YYYY-MM-DD');
    console.log('Data formatada recebida:', dataVencimentoFormatada); // Log para depuração

    // Consulta SQL para cheques com a data de vencimento fornecida
    const query = 'SELECT * FROM cheques WHERE DATE(data_vencimento) = ?';
    
    db.query(query, [dataVencimentoFormatada], (err, results) => {
        if (err) {
            console.error('Erro ao consultar cheques:', err);
            return res.status(500).json({ error: 'Erro ao consultar cheques.' });
        }

        if (results.length > 0) {
            res.json(results); // Retorna os resultados
        } else {
            res.status(404).json({ message: 'Nenhum cheque encontrado para a data informada.' });
        }
    });
});

   
   

   app.get('/api/cheques/relatorio', (req, res) => {
    const { dataInicio, dataFim } = req.query;

    const sql = `
        SELECT cheque_numero, nome_beneficiario, data_emissao, data_vencimento, valor, status
        FROM cheques
        WHERE data_emissao BETWEEN ? AND ?
    `;

    const values = [dataInicio, dataFim];

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Erro ao buscar relatório de cheques:', err);
            res.status(500).json({ error: 'Erro ao buscar relatório de cheques' });
            return;
        }

        // Não sobrescreva o status que já vem do banco de dados
        const chequesComStatus = results.map((cheque) => ({
            ...cheque,
            status: cheque.status, // Status real do banco
        }));

        console.log('Resultados encontrados:', chequesComStatus); // Log de depuração
        res.json(chequesComStatus);
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
    const sql = `
        SELECT * FROM boletos 
        WHERE data_vencimento = CURDATE() 
        OR data_vencimento = CURDATE() + INTERVAL 1 DAY
        ORDER BY data_vencimento ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar boletos próximos ao vencimento:', err);
            res.status(500).json({ error: 'Erro ao buscar boletos próximos ao vencimento' });
            return;
        }
        res.json(results);
    });
});

app.get('/api/boletos/buscar-por-vencimento', (req, res) => {
    const { dataVencimento } = req.query;

    if (!dataVencimento) {
        return res.status(400).json({ error: 'Data de vencimento é necessária' });
    }

    // Consulta ao banco de dados para buscar os boletos pela data de vencimento
    const query = "SELECT * FROM boletos WHERE data_vencimento = ?";
    db.query(query, [dataVencimento], (err, results) => {
        if (err) {
            console.error('Erro ao consultar boletos:', err);
            return res.status(500).json({ error: 'Erro ao consultar boletos' });
        }

        // Retorna os resultados para o frontend
        res.json(results);
    });
});

app.patch('/api/boletos/pagar/:id', (req, res) => {
    const boletoId = req.params.id;

    // Verificar se o boleto existe e atualizar seu status para "pago"
    const queryBuscar = 'SELECT * FROM boletos WHERE id = ?';
    const queryAtualizar = 'UPDATE boletos SET status = ? WHERE id = ?';

    db.query(queryBuscar, [boletoId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar boleto:', err);
            return res.status(500).json({ success: false, message: 'Erro ao buscar o boleto.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Boleto não encontrado.' });
        }

        const boleto = results[0];

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
    const { status } = req.query;  // Obtém o parâmetro de status

    let query = "SELECT * FROM boletos";  // Consulta inicial sem filtro
    let params = [];

    if (status && status !== 'todos') {
        query += " WHERE status = ?";
        params.push(status);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro ao consultar boletos:', err);
            return res.status(500).json({ error: 'Erro ao consultar boletos' });
        }

        res.json(results);  // Retorna os boletos filtrados por status
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
app.get('/api/cheques/proximos', (req, res) => {
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(hoje.getDate() + 1);

    // Ajustar a data para garantir que estamos pegando apenas o dia (sem considerar hora, minuto, segundo)
    const amanhaInicio = new Date(amanha.setHours(0, 0, 0, 0)); // Início do dia de amanhã
    const amanhaFim = new Date(amanha.setHours(23, 59, 59, 999)); // Fim do dia de amanhã

    // Ajustando a consulta para buscar todos os cheques que vencem amanhã
    const sql = `
        SELECT * FROM cheques 
        WHERE status = 'Pendente' AND data_vencimento BETWEEN ? AND ? 
        ORDER BY data_vencimento ASC
    `;
    
    db.query(sql, [amanhaInicio.toISOString(), amanhaFim.toISOString()], (err, results) => {
        if (err) {
            console.error('Erro ao carregar próximos cheques:', err);
            return res.status(500).json({ success: false, message: 'Erro ao carregar próximos cheques' });
        }

        // Atualiza automaticamente os cheques que passaram da data de vencimento
        const hoje = new Date(); // Esta linha é mantida fora do loop

        results.forEach((cheque) => {
            const dataVencimento = new Date(cheque.data_vencimento);

            // Verifica se a data de vencimento já passou e o status está "Pendente"
            if (cheque.status === 'Pendente' && dataVencimento < hoje) {
                const updateSql = `UPDATE cheques SET status = 'Atrasado' WHERE cheque_numero = ?`;

                db.query(updateSql, [cheque.cheque_numero], (err, updateResults) => {
                    if (err) {
                        console.error('Erro ao atualizar o status para Atrasado:', err);
                    } else {
                        console.log(`Cheque ${cheque.cheque_numero} atualizado para Atrasado.`);
                    }
                });
            }
        });

        // Retorna os cheques próximos ao vencimento
        res.json({ success: true, cheques: results });
    });
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