document.querySelectorAll('.js-toggle-senha').forEach((botao) => {
  botao.addEventListener('click', () => {
    const input = document.getElementById(botao.getAttribute('aria-controls'));
    const mostrar = input.type === 'password';
    input.type = mostrar ? 'text' : 'password';
    botao.setAttribute('aria-pressed', mostrar);
    botao.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
  });
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarCampo(input) {
  const valor = input.value.trim();

  if (input.required && !valor) {
    return 'Preencha este campo.';
  }
  if (input.type === 'email' && !EMAIL_REGEX.test(valor)) {
    return 'Digite um e-mail válido, como nome@email.com.';
  }
  if (input.name === 'nome' && valor.length < 3) {
    return 'Digite seu nome completo.';
  }
  if (input.type === 'tel' && valor.replace(/\D/g, '').length < 10) {
    return 'Digite o telefone com DDD.';
  }
  if (input.minLength > 0 && input.value.length < input.minLength) {
    return `A senha precisa ter pelo menos ${input.minLength} caracteres.`;
  }
  if (input.minLength > 0 && !(/[a-zA-Z]/.test(input.value) && /\d/.test(input.value))) {
    return 'Use letras e números na senha.';
  }
  if (input.dataset.match) {
    const original = document.getElementById(input.dataset.match);
    if (input.value !== original.value) return 'As senhas não são iguais.';
  }
  return '';
}

function mostrarErro(input, mensagem) {
  const erro = document.getElementById(`${input.id}-erro`);
  if (erro) erro.textContent = mensagem;
  input.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
}

document.querySelectorAll('input[type="tel"]').forEach((input) => {
  input.addEventListener('input', () => {
    const d = input.value.replace(/\D/g, '').slice(0, 11);
    let v = d;
    if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length > 6) v = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
    input.value = v;
  });
});

document.querySelectorAll('.js-auth-form').forEach((form) => {
  const campos = form.querySelectorAll('.field__input');
  const status = form.querySelector('.auth__status');

  campos.forEach((input) => {
    input.addEventListener('blur', () => {
      if (input.value) mostrarErro(input, validarCampo(input));
    });
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') {
        mostrarErro(input, validarCampo(input));
      }
    });
  });

  form.addEventListener('submit', (evento) => {
    let primeiroInvalido = null;

    campos.forEach((input) => {
      const mensagem = validarCampo(input);
      mostrarErro(input, mensagem);
      if (mensagem && !primeiroInvalido) primeiroInvalido = input;
    });

    if (primeiroInvalido) {
      evento.preventDefault();
      status.textContent = '';
      primeiroInvalido.focus();
      return;
    }

    evento.preventDefault();
    if (!BACKEND_CONECTADO) {
      status.textContent = MODO_TESTE
        ? 'Tudo certo! Entrando no painel…'
        : 'O acesso ainda não está disponível: o sistema não está conectado ao servidor.';
      if (MODO_TESTE && form.dataset.redirect) {
        setTimeout(() => { window.location.href = form.dataset.redirect; }, 800);
      }
      return;
    }
    enviarFormulario(form, status);
  });
});

function dadosDoFormulario(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function enviarFormulario(form, status) {
  const botao = form.querySelector('button[type="submit"]');
  const dados = dadosDoFormulario(form);
  const cadastro = form.getAttribute('action') === '/cadastro';
  botao.disabled = true;
  status.textContent = cadastro ? 'Criando sua conta…' : 'Entrando…';

  try {
    let auth;
    if (cadastro) {
      const resposta = await api('/auth/cadastro-voluntaria', {
        metodo: 'POST',
        corpo: {
          nome: dados.nome.trim(),
          email: dados.email.trim(),
          senha: dados.senha,
          telefone: dados.telefoneContato,
          area: dados.area,
          registroProfissional: dados.registroProfissional.trim(),
        },
      });
      auth = resposta.auth;
    } else {
      auth = await api('/auth/login', {
        metodo: 'POST',
        corpo: { email: dados.email.trim(), senha: dados.senha },
      });
    }
    Sessao.salvar(auth);
    window.location.href = form.dataset.redirect || 'painel.html';
  } catch (erro) {
    status.textContent = erro.status === 401 ? 'E-mail ou senha incorretos.' : erro.message;
    botao.disabled = false;
  }
}
