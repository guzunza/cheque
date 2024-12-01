// Função de login
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginBtn'); // Corrigir o botão de login

    if (!loginForm) {
        console.error('Formulário de login não encontrado!');
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value.trim();

        if (!email || !senha) {
            alert('Por favor, preencha todos os campos!');
            return;
        }

        loginButton.disabled = true;
        loginButton.innerText = 'Entrando...';

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message || 'Login realizado com sucesso!');
                // Redireciona para a página cadastro.html após login bem-sucedido
                window.location.href = '/cadastro.html';  // A URL de destino após o login
            } else {
                const errorMessage = await response.json();
                alert(errorMessage.message || 'Erro no login!');
            }
        } catch (error) {
            console.error('Erro ao conectar ao servidor:', error);
            alert('Erro ao conectar ao servidor. Tente novamente mais tarde.');
        } finally {
            loginButton.disabled = false;
            loginButton.innerText = 'Entrar';
        }
    });
});
