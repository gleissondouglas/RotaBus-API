function getResetPasswordHtml(token) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuvem - Nova Senha</title>
  <style>
    :root {
      --primary: #3B82F6;
      --primary-dark: #2563EB;
      --bg: #F6F8FA;
      --text: #011030;
      --text-muted: #666;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background-color: var(--bg);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: white;
      width: 100%;
      max-width: 400px;
      padding: 40px 32px;
      border-radius: 24px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      text-align: center;
    }
    .icon {
      font-size: 40px;
      background: #EBF5FF;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 24px;
      margin: 0 auto 24px;
    }
    h1 {
      color: var(--text);
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    p {
      color: var(--text-muted);
      font-size: 15px;
      line-height: 1.5;
      margin-bottom: 32px;
    }
    .input-group {
      text-align: left;
      margin-bottom: 20px;
    }
    .input-group label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 8px;
    }
    .input-group input {
      width: 100%;
      padding: 16px;
      border: 1.5px solid #E2E8F0;
      border-radius: 12px;
      font-size: 16px;
      transition: all 0.2s;
    }
    .input-group input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    button {
      width: 100%;
      padding: 18px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 32px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: var(--primary-dark);
    }
    button:disabled {
      background: #94A3B8;
      cursor: not-allowed;
    }
    .message {
      margin-top: 16px;
      font-size: 14px;
      font-weight: 500;
    }
    .message.error {
      color: #EF4444;
    }
    .message.success {
      color: #10B981;
    }
    #success-state {
      display: none;
    }
  </style>
</head>
<body>

  <div class="card" id="form-state">
    <div class="icon">🔒</div>
    <h1>Criar nova senha</h1>
    <p>Sua senha deve ter pelo menos 6 caracteres.</p>

    <form id="reset-form">
      <div class="input-group">
        <label for="password">Nova senha</label>
        <input type="password" id="password" required minlength="6" placeholder="Digite a nova senha">
      </div>
      <div class="input-group">
        <label for="confirm-password">Confirmar senha</label>
        <input type="password" id="confirm-password" required minlength="6" placeholder="Repita a nova senha">
      </div>

      <button type="submit" id="submit-btn">Redefinir senha</button>
      <div id="status-message" class="message"></div>
    </form>
  </div>

  <div class="card" id="success-state">
    <div class="icon" style="background: #D1FAE5;">✅</div>
    <h1>Senha alterada!</h1>
    <p>Sua nova senha foi salva com sucesso. Você já pode voltar ao aplicativo do Nuvem e fazer login.</p>
  </div>

  <script>
    const token = "${token}";
    const form = document.getElementById('reset-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const submitBtn = document.getElementById('submit-btn');
    const statusMessage = document.getElementById('status-message');
    
    const formState = document.getElementById('form-state');
    const successState = document.getElementById('success-state');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (passwordInput.value !== confirmPasswordInput.value) {
        statusMessage.textContent = "As senhas não coincidem.";
        statusMessage.className = "message error";
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Salvando...";
      statusMessage.textContent = "";

      try {
        const response = await fetch('/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: token,
            newPassword: passwordInput.value
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Erro ao redefinir a senha.");
        }

        formState.style.display = 'none';
        successState.style.display = 'block';

      } catch (error) {
        statusMessage.textContent = error.message;
        statusMessage.className = "message error";
        submitBtn.disabled = false;
        submitBtn.textContent = "Redefinir senha";
      }
    });
  </script>
</body>
</html>
  `;
}

module.exports = {
  getResetPasswordHtml
};
