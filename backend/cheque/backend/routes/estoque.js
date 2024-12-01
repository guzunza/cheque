router.delete('/estoque/:id', (req, res) => {
    const chequeId = req.params.id; ue  // Obtém o id do cheque a ser excluído

    const query = 'DELETE FROM estoque WHERE id = ?';

    db.query(query, [chequeId], (err, result) => {
        if (err) {
            console.error('Erro ao excluir estoque:', err);
            return res.status(500).json({ error: 'Erro ao excluir estoque' });
        }

        // Verifica se algum cheque foi excluído
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'estoque não encontrado' });
        }

        res.status(200).json({ message: 'estoque excluído com sucesso!' });
    });
});