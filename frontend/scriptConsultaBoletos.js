document.addEventListener('DOMContentLoaded', function () {
    consultarBoletos(); // Chama a função assim que a página for carregada
});

function formatarData(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// Função para consultar boletos e exibir em tabela
function consultarBoletos() {
    const statusSelecionado = document.getElementById('consultaStatus').value;  // Obtém o status selecionado

    fetch(`http://localhost:5002/api/boletos/consultar-por-status?status=${statusSelecionado}`)  // Nova rota para pegar boletos com filtro de status
        .then(response => response.json())
        .then(data => {
            const resultadosDiv = document.getElementById("resultados");
            resultadosDiv.innerHTML = '';  // Limpa a área de resultados

            if (data.length > 0) {
                // Cria a tabela
                // Cria a tabela
let tabela = `
<table class="tabela-boletos"> <!-- Adiciona a classe para aplicar o estilo -->
    <thead>
        <tr>
            <th>Nome do Pagador</th>
            <th>CPF do Pagador</th>
            <th>Endereço do Pagador</th>
            <th>Valor</th>
            <th>Data de Emissão</th>
            <th>Data de Vencimento</th>
            <th>Descrição</th>
            <th>Ações</th>
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
        <td>
            <button onclick="editarBoleto(${boleto.id})">Editar</button>
            <button onclick="deletarBoleto(${boleto.id})">Deletar</button>
        </td>
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
                resultadosDiv.innerHTML = '<p>Nenhum boleto encontrado.</p>';
            }
        })
        .catch(error => {
            console.error('Erro ao consultar boletos:', error);
            alert('Erro ao consultar boletos.');
        });
}

// Função para deletar um boleto
function deletarBoleto(id) {
    if (confirm('Tem certeza que deseja excluir este boleto?')) {
        fetch(`http://localhost:5002/api/boletos/deletar/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Boleto excluído com sucesso!');
                consultarBoletos();  // Atualiza a lista de boletos
            } else {
                alert('Erro ao excluir o boleto.');
            }
        })
        .catch(error => {
            console.error('Erro ao excluir o boleto:', error);
            alert('Erro ao conectar com o servidor.');
        });
    }
}

function editarBoleto(id) {
    console.log("Editar boleto chamado para o ID:", id);  // Log para verificar se a função está sendo chamada
    
    // Fetch para obter os dados do boleto específico
    fetch(`http://localhost:5002/api/boletos/boletos?id=${id}`)
    .then(response => {
        console.log('Status da resposta:', response.status);  // Verifica o status da resposta
        return response.text();  // Altere para .text() para verificar a resposta bruta
    })
    .then(text => {
        console.log('Resposta bruta do servidor:', text);  // Exibe a resposta bruta
        try {
            const boleto = JSON.parse(text);  // Tenta analisar o JSON
            console.log("Dados do boleto:", boleto);
            // Preencher o formulário com os dados do boleto
            document.getElementById('nome_pagador').value = boleto.nome_pagador;
            document.getElementById('cpf_pagador').value = boleto.cpf_pagador;
            document.getElementById('endereco_pagador').value = boleto.endereco_pagador;
            document.getElementById('valor').value = boleto.valor;
            document.getElementById('data_emissao').value = formatarData(boleto.data_emissao);
            document.getElementById('data_vencimento').value = formatarData(boleto.data_vencimento);
            document.getElementById('descricao').value = boleto.descricao;
            document.getElementById('status').value = boleto.status;
            
            document.getElementById('form-edicao').setAttribute('data-id', boleto.id);
            document.getElementById('form-edicao').style.display = 'block';
        } catch (error) {
            console.error('Erro ao parsear o JSON:', error);
            alert('Erro ao carregar os dados do boleto.');
        }
    })
    .catch(error => {
        console.error('Erro ao carregar os dados do boleto:', error);
        alert('Erro ao carregar os dados do boleto.');
    });

}



function atualizarBoleto(event) {
    event.preventDefault();  // Previne o envio normal do formulário

    // Obtém o ID do boleto armazenado no formulário de edição
    const id = document.getElementById('form-edicao').getAttribute('data-id');

    const boletoAtualizado = {
        nome_pagador: document.getElementById('nome_pagador').value,
        cpf_pagador: document.getElementById('cpf_pagador').value,
        endereco_pagador: document.getElementById('endereco_pagador').value,
        valor: document.getElementById('valor').value,
        data_emissao: document.getElementById('data_emissao').value,
        data_vencimento: document.getElementById('data_vencimento').value,
        descricao: document.getElementById('descricao').value,
        status: document.getElementById('status').value
    };

    // Enviar os dados atualizados para a API
    fetch(`http://localhost:5002/api/boletos/boletos/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(boletoAtualizado)
    })
    
    .then(response => response.json())
    .then(data => {
        alert('Boleto atualizado com sucesso!');
        consultarBoletos();  // Atualiza a lista de boletos
        document.getElementById('form-edicao').style.display = 'none';  // Oculta o formulário de edição
    })
    .catch(error => {
        console.error('Erro ao atualizar o boleto:', error);
        alert('Erro ao atualizar o boleto.');
    });
}