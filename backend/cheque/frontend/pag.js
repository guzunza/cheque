document.addEventListener('DOMContentLoaded', function () {
    console.log("Script inicializado.");

    // Identifica a página atual
    const bodyId = document.body.id;

    // Executa o código relevante para cada página
    if (bodyId === 'page-cadastro') {
        console.log("Página Cadastro detectada.");
        initCadastroCheque();
        carregarProximosCheques();
    } else if (bodyId === 'page-relatorio') {
        console.log("Página Relatório detectada.");
        initRelatorio();
    } else {
        console.warn("ID de página não reconhecido:", bodyId);
    }
});

const consultarBtn = document.getElementById('consultar-btn');
if (consultarBtn) {
    consultarBtn.addEventListener('click', consultarCheques);
} else {
    console.warn("Botão 'consultar-btn' não encontrado.");
}

// Inicializa o formulário de cadastro de cheques
function initCadastroCheque() {
    console.log("Página Cadastro de Cheques inicializada.");

    const chequeForm = document.getElementById('chequeForm');
    if (chequeForm) {
        chequeForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const chequeData = {
                cheque_numero: document.getElementById('cheque_numero').value,
                data_emissao: document.getElementById('data_emissao').value,
                nome_beneficiario: document.getElementById('nome_beneficiario').value,
                valor: parseFloat(document.getElementById('valor').value),
                data_vencimento: document.getElementById('data_vencimento').value,
                descricao: document.getElementById('descricao').value,
                empresa: document.getElementById('empresa').value
            };

            try {
                const response = await fetch('http://localhost:5002/api/cheques/cadastrocheque', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(chequeData),
                });
                
                const result = await response.json();
                if (response.ok) {
                    alert(result.message || 'Cheque cadastrado com sucesso!');
                    chequeForm.reset();
                    carregarProximosCheques(); // Atualiza os cheques após o cadastro
                } else {
                    alert(result.error || 'Erro ao cadastrar o cheque.');
                }
                
            } catch (error) {
                console.error('Erro na requisição:', error);
                alert('Erro ao conectar com o servidor.');
            }
        });
    } else {
        console.warn("Formulário de cadastro de cheques não encontrado.");
    }
}

// Inicializa o relatório de cheques
function initRelatorio() {
    const relatorioForm = document.getElementById('relatorioForm');
    const resultadosDiv = document.getElementById('resultados');
    const loadingSpinner = document.getElementById('loadingSpinner');

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
                loadingSpinner.style.display = 'block';
                resultadosDiv.innerHTML = '';

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
                                <td>${cheque.status || 'Indefinido'}</td> <!-- Exibe 'Indefinido' se status estiver vazio -->
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
                alert('Erro ao buscar relatório.');
            } finally {
                loadingSpinner.style.display = 'none';
            }
        });
    } else {
        console.warn("Formulário de relatório não encontrado.");
    }
}

// Carrega os próximos cheques a vencer
async function carregarProximosCheques() {
    try {
        const response = await fetch('http://localhost:5002/api/cheques/proximos');
        const cheques = await response.json();

        const chequesContainer = document.getElementById('chequesLista');
        chequesContainer.innerHTML = ''; // Limpa cheques antigos

        if (cheques.length > 0) {
            cheques.forEach((cheque) => {
                const chequeDiv = document.createElement('div');
                chequeDiv.className = 'cheque-info';
                chequeDiv.innerHTML = `
                    <p><strong>Cheque Nº:</strong> ${cheque.cheque_numero}</p>
                    <p><strong>Empresa:</strong> ${cheque.empresa}</p>
                    <p><strong>Beneficiário:</strong> ${cheque.nome_beneficiario}</p>
                    <p><strong>Data de Vencimento:</strong> ${new Date(cheque.data_vencimento).toLocaleDateString('pt-BR')}</p>
                    <p><strong>Valor:</strong> R$ ${parseFloat(cheque.valor).toFixed(2).replace('.', ',')}</p>
                    <p><strong>Status:</strong> ${cheque.status}</p>
                    <button class="compensar-btn" onclick="marcarComoCompensado('${cheque.cheque_numero}')">Marcar como Compensado</button>
                `;
                chequesContainer.appendChild(chequeDiv);
            });
        } else {
            chequesContainer.innerHTML = '<p>Nenhum cheque próximo ao vencimento encontrado.</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar próximos cheques:', error);
        alert('Erro ao carregar próximos cheques.');
    }
}

// Chama a função após o DOM ser carregado
document.addEventListener('DOMContentLoaded', carregarProximosCheques);


// Função para formatar a data
function formatarData(data) {
    const date = new Date(data);
    if (isNaN(date)) return 'Data inválida';
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

// Função para atualizar o status de um cheque no servidor
async function marcarComoCompensado(chequeNumero) {
    await atualizarStatusCheque(chequeNumero, 'Compensado');
    // Recarregar os cheques após a atualização para refletir a mudança
    carregarProximosCheques();
}

// Função para atualizar o status de um cheque no servidor
async function atualizarStatusCheque(chequeNumero, status) {
    try {
        const response = await fetch(`http://localhost:5002/api/cheques/atualizar-status/${chequeNumero}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('Status do cheque atualizado com sucesso!');
        } else {
            console.error('Erro ao atualizar o status do cheque:', result.message);
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
    }
}

// Função para formatar a data no formato desejado (ex: dd/mm/yyyy)
function formatarData(data) {
    const date = new Date(data);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
}


function consultarCheques() {
    const dataVencimento = document.getElementById('consultaData').value;

    console.log('Data de vencimento capturada:', dataVencimento); // Debug

    if (!dataVencimento) {
        alert('Por favor, preencha a data de vencimento.');
        return;
    }

    // Fazendo a requisição para a API que consulta cheques por data de vencimento
    fetch(`http://localhost:5002/api/cheques/buscar-por-vencimento?dataVencimento=${dataVencimento}`)
        .then(response => response.json())
        .then(data => {
            console.log('Cheques encontrados:', data); // Debug

            const resultadosDiv = document.getElementById("resultados");
            resultadosDiv.innerHTML = ''; // Limpa a área de resultados

            if (data.length > 0) {
                // Cria a tabela
                let tabela = `
                    <table border="1">
                        <thead>
                            <tr>
                                <th>Cheque Nº</th>
                                <th>Beneficiário</th>
                                <th>Valor</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                // Adiciona os dados dos cheques na tabela
                data.forEach(cheque => {
                    tabela += `
                        <tr>
                            <td>${cheque.cheque_numero || 'N/A'}</td>
                            <td>${cheque.nome_beneficiario || 'N/A'}</td>
                            <td>${cheque.valor || 'N/A'}</td>
                            <td>${cheque.status || 'Indefinido'}</td>
                        </tr>
                    `;
                });

                // Fecha a tabela
                tabela += `
                        </tbody>
                    </table>
                `;

                resultadosDiv.innerHTML = tabela; // Exibe a tabela
            } else {
                resultadosDiv.innerHTML = '<p>Nenhum cheque encontrado para esta data.</p>';
            }
        })
        .catch(error => {
            console.error('Erro ao consultar cheques:', error);
            alert('Erro ao consultar cheques.');
        });
}


// Função para formatar a data no formato correto
function formatarData(data) {
    const d = new Date(data);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0'); // Mês começa do 0
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// Adiciona o evento de click no botão para chamar a função consultarCheques
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('consultar-btn').addEventListener('click', consultarCheques);
});

async function marcarComoCompensado(chequeNumero) {
    try {
        // Fazendo a requisição PATCH para a API
        const response = await fetch(`http://localhost:5002/api/cheques/compensar/${chequeNumero}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // Verifica se a resposta foi bem-sucedida
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao marcar cheque como compensado');
        }

        // Se o cheque foi marcado como compensado com sucesso, atualiza o DOM
        const chequeDiv = document.getElementById(`cheque-${chequeNumero}`);

        if (chequeDiv) {
            // Alterar o status para "Compensado"
            const statusElement = chequeDiv.querySelector('p:last-child');
            if (statusElement) {
                statusElement.textContent = 'Status: Compensado';
            }

            // Alterar a classe para refletir o status compensado, se necessário
            chequeDiv.classList.add('compensado');
            
            // Esconder ou desabilitar o botão de compensar
            const button = chequeDiv.querySelector('.compensar-btn');
            if (button) {
                button.disabled = true;
                button.style.display = 'none';
            }

            // Exibir um feedback para o usuário
            alert(data.message); // Exibe a mensagem de sucesso retornada pela API
        }

    } catch (error) {
        console.error('Erro ao marcar o cheque como compensado:', error);
        alert('Erro ao marcar o cheque como compensado.');
    }
}
