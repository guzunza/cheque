const bcrypt = require('bcrypt');
const db = require('./backend/db/connection.js'); // Certifique-se de que o caminho está correto

(async () => {
    try {
        // Busca todos os usuários com senhas em texto puro
        const [rows] = await db.execute('SELECT id, senha FROM clientes');

        for (const row of rows) {
            // Criptografa a senha
            const hashedPassword = await bcrypt.hash(row.senha, 10);

            // Atualiza a senha no banco
            await db.execute('UPDATE clientes SET senha = ? WHERE id = ?', [hashedPassword, row.id]);
        }

        console.log('Todas as senhas foram atualizadas com sucesso!');
    } catch (err) {
        console.error('Erro ao atualizar senhas:', err);
    } finally {
        process.exit();
    }
})();
