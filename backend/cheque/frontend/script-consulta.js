// Variável global para armazenar os cheques
let cheques = [];

// Função para carregar todos os cheques
function carregarCheques() {
    const status = document.getElementById('statusFilter').value;
    const url = `http://localhost:5002/api/cheques?status=${status}`;

    // Fazendo a requisição para o backend
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Erro ao carregar cheques');
            return response.json();
        })
        .then(data => {
            cheques = data;
            exibirCheques(data);
        })
        .catch(error => {
            console.error('Erro ao carregar os cheques:', error);
            alert('Erro ao carregar cheques. Tente novamente mais tarde.');
        });
}

// Função para exibir os cheques na tabela
function exibirCheques(cheques) {
    const tabela = document.getElementById('chequesTable');
    tabela.innerHTML = `
        <tr>
            <th>ID</th>
            <th>Nome do Emitente</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Data de Emissão</th>
            <th>Data de Vencimento</th>
            <th>Ações</th>
        </tr>
    `;

    cheques.forEach(cheque => {
        const dataEmissaoFormatada = cheque.data_emissao
            ? new Date(cheque.data_emissao).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            })
            : 'Data inválida';

        const dataVencimentoFormatada = cheque.data_vencimento
            ? new Date(cheque.data_vencimento).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            })
            : 'Data inválida';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cheque.cheque_numero}</td>
            <td>${cheque.nome_beneficiario}</td>
            <td>${cheque.valor}</td>
            <td>${cheque.status}</td>
            <td>${dataEmissaoFormatada}</td>
            <td>${dataVencimentoFormatada}</td>
            <td>
                <button onclick="editarCheque(${cheque.id})">Editar</button>
                <button onclick="excluirCheque(${cheque.id})">Excluir</button>
            </td>
        `;
        tabela.appendChild(row);
    });
}

// Função para filtrar os cheques
function filtrarCheques() {
    carregarCheques();
}

// Função para excluir cheque
function excluirCheque(id) {
    if (confirm('Tem certeza que deseja excluir este cheque?')) {
        fetch(`/api/cheques/${id}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) throw new Error('Erro ao excluir o cheque');
                return response.json();
            })
            .then(data => {
                alert(data.message);
                carregarCheques();
            })
            .catch(error => {
                console.error('Erro ao excluir cheque:', error);
                alert('Erro ao excluir cheque. Tente novamente mais tarde.');
            });
    }
}

// Função para editar cheque
function editarCheque(id) {
    const cheque = cheques.find(c => c.id === id);

    if (!cheque) {
        console.error('Cheque não encontrado!');
        alert('Cheque não encontrado.');
        return;
    }

    document.getElementById('editChequeId').value = cheque.id;
    document.getElementById('editChequeNumero').value = cheque.cheque_numero;
    document.getElementById('editNomeBeneficiario').value = cheque.nome_beneficiario;
    document.getElementById('editValor').value = cheque.valor;
    document.getElementById('editStatus').value = cheque.status;
    document.getElementById('editDataEmissao').value = cheque.data_emissao.split('T')[0];
    document.getElementById('editDataVencimento').value = cheque.data_vencimento.split('T')[0];
    document.getElementById('editDescricao').value = cheque.descricao;

    document.getElementById('modalEditar').style.display = 'block';
}

// Atualiza os dados do cheque quando o formulário for enviado
const chequeForm = document.getElementById('formEditarCheque');
chequeForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const chequeData = {
        id: document.getElementById('editChequeId').value,
        cheque_numero: document.getElementById('editChequeNumero').value,
        nome_beneficiario: document.getElementById('editNomeBeneficiario').value,
        valor: parseFloat(document.getElementById('editValor').value),
        status: document.getElementById('editStatus').value,
        data_emissao: document.getElementById('editDataEmissao').value,
        data_vencimento: document.getElementById('editDataVencimento').value,
        descricao: document.getElementById('editDescricao').value,
    };

    try {
        const response = await fetch(`/api/cheques/${chequeData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(chequeData),
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message || 'Cheque atualizado com sucesso!');
            carregarCheques();
            document.getElementById('modalEditar').style.display = 'none';
        } else {
            alert(result.error || 'Erro ao atualizar o cheque.');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro ao conectar com o servidor.');
    }
});


// Carrega os cheques ao carregar a página
window.onload = carregarCheques;
