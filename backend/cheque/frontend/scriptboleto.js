document.addEventListener('DOMContentLoaded', function () {
    // Verifica se o formulário existe e adiciona o ouvinte de evento
    const chequeForm = document.getElementById('chequeForm');
    console.log("chequeForm encontrado:", chequeForm);

    if (chequeForm) {
        chequeForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            console.log("Evento submit disparado para o formulário de boleto");

            // Coleta os dados do formulário
            const boletoData = {
                nome_pagador: document.getElementById('nome_pagador').value,
                cpf_pagador: document.getElementById('cpf_pagador').value,
                endereco_pagador: document.getElementById('endereco_pagador').value,
                valor: parseFloat(document.getElementById('valor').value),
                data_emissao: document.getElementById('data_emissao').value,
                data_vencimento: document.getElementById('data_vencimento').value,
                descricao: document.getElementById('descricao').value
            };

            try {
                // Envia os dados para o backend
                const response = await fetch('http://localhost:5002/api/boletos/cadastroboleto', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(boletoData)
                });

                const result = await response.json();
                if (response.ok) {
                    alert(result.message || 'Boleto cadastrado com sucesso!');
                    chequeForm.reset(); // Limpa o formulário após o sucesso
                } else {
                    alert(result.error || 'Erro ao cadastrar o Boleto.');
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                alert('Erro ao conectar com o servidor.');
            }
        });
    } else {
        console.error('Erro: Formulário com ID "chequeForm" não encontrado.');
    }

    // Chama a função para buscar boletos próximos ao vencimento ao carregar a página
    buscarBoletosProximos();
});

// Função para buscar boletos próximos ao vencimento
function buscarBoletosProximos() {
    fetch('http://localhost:5002/api/boletos/proximos-boletos')
        .then(response => response.json())
        .then(data => {
            const proximoBoletoDiv = document.getElementById("proximoBoleto");
            proximoBoletoDiv.innerHTML = ''; // Limpa a área onde os boletos serão listados

            if (Array.isArray(data) && data.length > 0) {
                data.forEach(boleto => {
                    // Verifica se o status do boleto é diferente de "pago"
                    if (boleto.status !== 'pago') {
                        const boletoInfo = document.createElement("div");
                        boletoInfo.className = "boleto-info";
                        boletoInfo.id = `boleto-${boleto.id}`;
                        boletoInfo.innerHTML = `
                            <p><strong>Nome do Pagador:</strong> ${boleto.nome_pagador}</p>
                            <p><strong>CPF do Pagador:</strong> ${boleto.cpf_pagador}</p>
                            <p><strong>Endereço do Pagador:</strong> ${boleto.endereco_pagador}</p>
                            <p><strong>Valor:</strong> ${boleto.valor}</p>
                            <p><strong>Data de Emissão:</strong> ${formatarData(boleto.data_emissao)}</p>
                            <p><strong>Data de Vencimento:</strong> ${formatarData(boleto.data_vencimento)}</p>
                            <p><strong>Descrição:</strong> ${boleto.descricao}</p>
                            <p><strong>Status:</strong> ${boleto.status}</p>
                            <button onclick="marcarComoPago(${boleto.id})">Marcar como Pago</button>
                        `;
                        proximoBoletoDiv.appendChild(boletoInfo);
                    }
                });
            } else {
                proximoBoletoDiv.innerHTML = '<p>Nenhum boleto próximo ao vencimento.</p>';
            }
        })
        .catch(error => {
            console.error('Erro ao buscar boletos próximos ao vencimento:', error);
            alert('Erro ao buscar boletos próximos ao vencimento.');
        });
}

// Função para formatar data no formato dd/mm/yyyy
function formatarData(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// Função para marcar boleto como pago
function marcarComoPago(id) {
    console.log('ID do boleto:', id); // Verifique se o ID está correto
    fetch(`http://localhost:5002/api/boletos/pagar/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Boleto marcado como pago!');
            // Remover o boleto da tela (após ser marcado como pago)
            const boletoDiv = document.getElementById(`boleto-${id}`);
            if (boletoDiv) {
                boletoDiv.remove();
            }
        } else {
            alert('Erro ao marcar boleto como pago.');
        }
    })
    .catch(error => {
        console.error('Erro ao marcar boleto como pago:', error);
        alert('Erro ao marcar boleto como pago.');
    });
}

// Função para consultar boletos por vencimento e exibir em tabela
function consultarBoletos() {
    const dataVencimento = document.getElementById('consultaData').value;
    fetch(`http://localhost:5002/api/boletos/consultar-boleto-por-vencimento?dataVencimento=${dataVencimento}`)
        .then(response => response.json())
        .then(data => {
            const resultadosDiv = document.getElementById("resultados");
            resultadosDiv.innerHTML = '';  // Limpa a área de resultados

            if (data.length > 0) {
                // Cria a tabela
                let tabela = `
                    <table border="1">
                        <thead>
                            <tr>
                                <th>Nome do Pagador</th>
                                <th>CPF do Pagador</th>
                                <th>Endereço do Pagador</th>
                                <th>Valor</th>
                                <th>Data de Emissão</th>
                                <th>Data de Vencimento</th>
                                <th>Descrição</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                // Adiciona os dados dos boletos na tabela
                data.forEach(boleto => {
                    tabela += `
                        <tr>
                            <td>${boleto.nome_pagador}</td>
                            <td>${boleto.cpf_pagador}</td>
                            <td>${boleto.endereco_pagador}</td>
                            <td>${boleto.valor}</td>
                            <td>${formatarData(boleto.data_emissao)}</td>
                            <td>${formatarData(boleto.data_vencimento)}</td>
                            <td>${boleto.descricao}</td>
                        </tr>
                    `;
                });

                // Fecha a tabela
                tabela += `
                        </tbody>
                    </table>
                `;
                resultadosDiv.innerHTML = tabela;  // Exibe a tabela
            } else {
                resultadosDiv.innerHTML = '<p>Nenhum boleto encontrado para esta data.</p>';
            }
        })
        .catch(error => {
            console.error('Erro ao consultar boletos:', error);
            alert('Erro ao consultar boletos.');
        });
}
