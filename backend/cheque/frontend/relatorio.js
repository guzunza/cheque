document.addEventListener('DOMContentLoaded', function () {
    const relatorioForm = document.getElementById('relatorioForm');
    const resultadosDiv = document.getElementById('resultados');
    const errorMessage = document.getElementById('errorMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const btnImprimir = document.getElementById('btnImprimir');

    // Adiciona um evento para o botão de impressão
    if (btnImprimir) {
        btnImprimir.addEventListener('click', function () {
            imprimirRelatorio();
        });
    }

    if (relatorioForm) {
        relatorioForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const dataInicio = document.getElementById('data_inicio').value;
            const dataFim = document.getElementById('data_fim').value;

            if (!dataInicio || !dataFim) {
                alert('Por favor, preencha as datas de início e fim.');
                return;
            }

            try {
                // Exibir spinner e ocultar mensagens anteriores
                loadingSpinner.style.display = 'block';
                resultadosDiv.innerHTML = '';
                errorMessage.style.display = 'none';

                const response = await fetch(`http://localhost:5002/api/cheques/relatorio?dataInicio=${dataInicio}&dataFim=${dataFim}`);
                const cheques = await response.json();

                if (response.ok && cheques.length > 0) {
                    let tabelaHTML = `
                        <h3>Relatório de Cheques</h3>
                        <table>
                            <tr>
                                <th>Número</th>
                                <th>Beneficiário</th>
                                <th>Data de Emissão</th>
                                <th>Data de Vencimento</th>
                                <th>Valor</th>
                                <th>Status</th>
                            </tr>
                    `;

                    cheques.forEach(cheque => {
                        tabelaHTML += `
                            <tr>
                                <td>${cheque.cheque_numero}</td>
                                <td>${cheque.nome_beneficiario}</td>
                                <td>${formatarData(cheque.data_emissao)}</td>
                                <td>${formatarData(cheque.data_vencimento)}</td>
                                <td>R$ ${parseFloat(cheque.valor).toFixed(2).replace('.', ',')}</td>
                                <td>${cheque.status}</td>
                            </tr>
                        `;
                    });

                    tabelaHTML += '</table>';
                    resultadosDiv.innerHTML = tabelaHTML;

                } else {
                    resultadosDiv.innerHTML = '<p>Nenhum cheque encontrado para o período selecionado.</p>';
                }
            } catch (error) {
                console.error('Erro ao buscar relatório:', error);
                errorMessage.style.display = 'block';
            } finally {
                loadingSpinner.style.display = 'none';
            }
        });
    } else {
        console.warn("Formulário de relatório não encontrado.");
    }
});

// Função para formatar datas no formato DD/MM/AAAA
function formatarData(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// Função de impressão do relatório
function imprimirRelatorio() {
    const conteudo = document.getElementById('resultados').innerHTML;
    const janelaImpressao = window.open('', '', 'height=500,width=800');
    
    janelaImpressao.document.write('<html><head><title>Relatório de Cheques</title>');
    janelaImpressao.document.write('<style>body { font-family: Arial, sans-serif; margin: 20px; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style>');
    janelaImpressao.document.write('</head><body>');
    janelaImpressao.document.write(conteudo);
    janelaImpressao.document.write('</body></html>');
    
    janelaImpressao.document.close();
    janelaImpressao.print();
}
