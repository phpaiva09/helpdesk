function cadastrar() {
    const nomeCadastro = document.getElementById("nome-cadastro").value;
    const emailCadastro = document.getElementById("email-cadastro").value;
    const telefoneCadastro = document.getElementById("telefone-cadastro").value;
    const cpfCadastro = document.getElementById("cpf-cadastro").value;
    const senhaCadastro = document.getElementById("senha-cadastro").value;
    const confirmarSenhaCadastro = document.getElementById("confirmar-senha-cadastro").value;
    const tipoUsuario = document.getElementById("tipo-usuario").value;

    if (senhaCadastro !== confirmarSenhaCadastro) {
        abrirModal("As senhas não coincidem");
        return;
    }

    if (tipoUsuario === "") {
        abrirModal("Selecione o tipo de usuário");
        return;
    }

    fetch("http://127.0.0.1:5000/cadastro", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nome: nomeCadastro,
            email: emailCadastro,
            telefone: telefoneCadastro,
            cpf: cpfCadastro,
            senha: senhaCadastro,
            tipo: tipoUsuario
        })
    })
        .then(resposta => resposta.json())
        .then(dados => {
            if (dados.sucesso === false) {
                abrirModal(dados.mensagem);
                return;
            }

            if (dados.sucesso === true) {
                window.location.href = "pagelogin.html";
            }
        });
}

function login() {
    const emailLogin = document.getElementById("email-login").value;
    const senhaLogin = document.getElementById("senha-login").value;

    fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: emailLogin,
            senha: senhaLogin
        })
    })
        .then(resposta => resposta.json())
        .then(dados => {
            if (dados.sucesso === false) {
                abrirModal(dados.mensagem);
                return;
            }

            localStorage.setItem("usuarioLogado", emailLogin);
            localStorage.setItem("tipoUsuario", dados.tipo);

            if (dados.tipo === "usuario") {
                window.location.href = "pagecliente.html";
            }

            if (dados.tipo === "tecnico") {
                window.location.href = "pagetecnico.html";
            }
        })
}

function salvarPerfilTecnico() {
    const emailTecnico = localStorage.getItem("usuarioLogado");

    const nome = document.getElementById("nome-tecnico").value;
    const formacao = document.getElementById("formacao-tecnico").value;
    const area = document.getElementById("area-tecnico").value;
    const experiencia = document.getElementById("experiencia-tecnico").value;
    const resumo = document.getElementById("resumo-tecnico").value;

    console.log(nome, formacao, area, experiencia, resumo);
    console.log("Email logado:", emailTecnico);

    fetch("http://127.0.0.1:5000/salvar-perfil", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: emailTecnico,
            nome: nome,
            formacao: formacao,
            area: area,
            experiencia: experiencia,
            resumo: resumo
        })
    })
        .then(resposta => resposta.json())
        .then(dados => {
            abrirModal(dados.mensagem);

            setTimeout(() => {
                window.location.href = "pagetecnico.html";
            }, 1500);
        });
}

function carregarDados() {
    const emailUsuario = localStorage.getItem("usuarioLogado")

    fetch("http://127.0.0.1:5000/meus-dados", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: emailUsuario,
        })
    })
        .then(resposta => resposta.json())
        .then(dados => {
            const dadosConta = document.getElementById("dados-conta");

            dadosConta.innerHTML = `
            <p><strong>Nome</strong><br> ${dados.nome}</p>
            <p><strong>Email</strong><br> ${dados.email}</p>
            <p><strong>Telefone<br></strong> ${dados.telefone}</p>
            <p><strong>CPF<br></strong> ${dados.cpf}</p>
            <p><strong>Tipo<br></strong> ${dados.tipo}</p>
        `;
        })
}

function carregarChamados() {
    fetch("http://127.0.0.1:5000/listar-chamados")
        .then(resposta => resposta.json())
        .then(chamados => {
            const listaChamados = document.getElementById("lista-chamados");
            const chamadosPendentes = chamados.filter(chamado => chamado.status === "pendente");

            listaChamados.innerHTML = chamadosPendentes.map(chamado => {
                return `
            
            <div class="card-tecnico">
                        <h3>${chamado.nome || "Nome não informado"}</h3>

                        <hr>

                        <strong>Email</strong><br>
                        <p>${chamado.email || "Email não informado"}</p>

                        <strong>Telefone</strong><br>
                        <p>${chamado.telefone || "Telefone não informado"}</p>

                        <strong>Categoria</strong><br>
                        <p>
                            ${chamado.categoria || "Categoria não informada"}
                        </p>

                        <strong>Descrição</strong><br>
                        <p>
                            ${chamado.resumo || "Sem descrição do chamado"}
                        </p>

                        <button onclick="aceitarChamado(${chamado.id})">Aceitar Chamado</button>
                    </div>
                    `;
            }).join("");
        })
}

function carregarTecnicos() {
    fetch("http://127.0.0.1:5000/tecnicos")
        .then(resposta => resposta.json())
        .then(tecnicos => {
            const listaTecnicos = document.getElementById("lista-tecnicos");

            listaTecnicos.innerHTML = tecnicos.map(tecnico => {
                return `
             <div class="card-tecnico">
                        <h3>${tecnico.nome || "Técnico sem nome"}</h3>

                        <hr>

                        <strong>Área</strong><br>
                        <p>
                            ${tecnico.area || "Área não informada"}
                        </p>

                        <strong>Resumo</strong><br>
                        <p>
                            ${tecnico.resumo || "Sem descrição profissional"}
                        </p>

                        <div class="estrelas">
                            ${tecnico.media_avaliacao ? tecnico.media_avaliacao + " ★" : ""}
                        </div>

                        <button onclick="verCurriculo(
                            '${tecnico.nome}',
                            '${tecnico.formacao}',
                            '${tecnico.area}',
                            '${tecnico.experiencia}',
                            '${tecnico.resumo}',
                            '${tecnico.email}',
                            '${tecnico.telefone}'
                        )">
                            Ver currículo
                        </button>
                        <button onclick="SolicitarTecnico('${tecnico.email}')">
                            Solicitar técnico
                        </button>
                    </div>
                    `;
            }).join("");
        })
}

function SolicitarTecnico(emailTecnico) {
    localStorage.setItem("tecnicoSelecionado", emailTecnico);

    const emailCliente = localStorage.getItem("usuarioLogado");

    fetch("http://127.0.0.1:5000/meus-chamados-cliente", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: emailCliente
        })
    })
        .then(resposta => resposta.json())
        .then(chamados => {
            const listaChamados = document.getElementById("lista-chamados-cliente");

            const chamadosDisponiveis = chamados.filter(chamado => {
                return chamado.status === "pendente";
            });

            if (chamadosDisponiveis.length === 0) {
                listaChamados.innerHTML = `
                    <p style=color:#cbd5e1; margin-top:20px;">
                        Você ainda não tem chamados registrados ou o Técnico solicitado recusou
                    </p>
                `;
                return;
            }

            listaChamados.innerHTML = chamadosDisponiveis.map(chamado => {
                return `
                <div class="card-chamado">
                    <hr>
                    <h3>${chamado.titulo || "Chamado sem título"}</h3>
                    <p>${chamado.categoria}</p>
                    <p>${chamado.resumo}</p>

                    <button onclick="vincularTecnico(${chamado.id})">
                        Solicitar este chamado
                    </button>
                </div>
            `;
            }).join("");
        })

    document.getElementById("modal-solicitar-tecnico").style.opacity = "1";
    document.getElementById("modal-solicitar-tecnico").style.visibility = "visible";
}

function vincularTecnico(idChamado) {
    const emailTecnico = localStorage.getItem("tecnicoSelecionado");

    fetch("http://127.0.0.1:5000/solicitar-tecnico", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            emailTecnico: emailTecnico,
            id: idChamado
        })
    })
        .then(resposta => resposta.json())
        .then(dados => {
            abrirModal(dados.mensagem);
            fecharModalSolicitarTecnico();
        })
}

function verCurriculo(nome, formacao, area, experiencia, resumo, email, telefone) {
    document.getElementById("curriculo-nome").innerText = nome;
    document.getElementById("curriculo-area").innerText = area;
    document.getElementById("curriculo-formacao").innerText = formacao;
    document.getElementById("curriculo-experiencia").innerText = experiencia;
    document.getElementById("curriculo-resumo").innerText = resumo;
    document.getElementById("curriculo-email").innerText = "Email: " + email;
    document.getElementById("curriculo-telefone").innerText = "Telefone: " + telefone;

    document.getElementById("modal-curriculo").style.opacity = "1";
    document.getElementById("modal-curriculo").style.visibility = "visible";
}

function buscarCurriculoTecnico(emailTecnico) {
    fetch("http://127.0.0.1:5000/buscar-tecnico", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: emailTecnico
        })
    })
    .then(resposta => resposta.json())
    .then(tecnico => {
        verCurriculo(
            tecnico.nome,
            tecnico.formacao,
            tecnico.area,
            tecnico.experiencia,
            tecnico.resumo,
            tecnico.email,
            tecnico.telefone
        );
    })
}

function chamadosTecnico() {
    const emailTecnico = localStorage.getItem("usuarioLogado");

    fetch("http://127.0.0.1:5000/meus-chamados-tecnico", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: emailTecnico,
        })
    })
        .then(resposta => resposta.json())
        .then(chamados => {
            const listaMeusChamados = document.getElementById("lista-meus-chamados");

            const chamadosValidos = chamados.filter(chamado => {
                return chamado.status !== "recusado";
            });

            listaMeusChamados.innerHTML = chamadosValidos.map(chamado => {
                return `
                    <div class="card-chamado">
                        <h3>${chamado.titulo || "Chamado sem título"}</h3>

                        <hr>

                        <p>
                            <strong>Cliente</strong><br>
                            ${chamado.nome || "Não informado"}
                        </p>

                        <p>
                            <strong>Email</strong><br>
                            ${chamado.email || "Não informado"}
                        </p>

                        <p>
                            <strong>Telefone</strong><br>
                            ${chamado.telefone || "Sem telefone"}
                        </p>

                        <p>
                            <strong>Categoria</strong><br>
                            ${chamado.categoria || "Não informada"}
                        </p>

                        <p>
                            <strong>Descrição</strong><br>
                            ${chamado.resumo || "Sem descrição"}
                        </p>

                        <p>
                            <strong>Status</strong><br>
                            ${chamado.status}
                        </p>

                        ${chamado.status !== "aceito" ? `
                            <button onclick="aceitarChamado(${chamado.id})">
                                Aceitar
                            </button>

                            <button onclick="recusarChamado(${chamado.id})">
                                Recusar
                            </button>
                        ` : ""}
                    </div>
                `;
            }).join("");
        })
}

function chamadosCliente() {
    const emailCliente = localStorage.getItem("usuarioLogado");

    fetch("http://127.0.0.1:5000/meus-chamados-cliente", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: emailCliente,
        })
    })
        .then(resposta => resposta.json())
        .then(chamados => {
            const listaMeusChamados = document.getElementById("lista-meus-chamados-cliente");

            listaMeusChamados.innerHTML = chamados.map(chamado => {
                return `
                    <div class="card-chamado">
                        <h3>${chamado.titulo || "Chamado sem título"}</h3>

                        <hr>

                        <p>
                            <strong>Cliente</strong><br>
                            ${chamado.nome || "Não informado"}
                        </p>

                        <p>
                            <strong>Email</strong><br>
                            ${chamado.email || "Não informado"}
                        </p>

                        <p>
                            <strong>Telefone</strong><br>
                            ${chamado.telefone || "Sem telefone"}
                        </p>

                        <p>
                            <strong>Categoria</strong><br>
                            ${chamado.categoria || "Não informada"}
                        </p>

                        <p>
                            <strong>Descrição</strong><br>
                            ${chamado.resumo || "Sem descrição"}
                        </p>

                        <p>
                            <strong>Status</strong><br>
                            ${chamado.status}
                        </p>
                        <p>
                            <strong>Técnico responsável</strong><br>
                            ${chamado.status === "aceito"
                        ? chamado.tecnico
                        : "Ainda não definido"
                    }<br>

                            ${chamado.status === "aceito"
                        ? chamado.nome_tecnico
                        : ""
                    }
                        </p>
                        ${chamado.tecnico ? `
                            <button onclick="buscarCurriculoTecnico('${chamado.tecnico}')">
                                Ver currículo
                            </button>
                        ` : ""}
                    </div>
                `;
            }).join("");
        });
}

function CriarChamado() {
    const emailUsuario = localStorage.getItem("usuarioLogado");

    const titulo = document.getElementById("titulo-chamado").value;
    const categoria = document.getElementById("categoria-chamado").value;
    const resumo = document.getElementById("descricao-chamado").value;

    if (categoria === "" || resumo === "") {
        abrirModal("Selecione uma categoria e descreva ela")
        return;
    }

    fetch("http://127.0.0.1:5000/criar-chamado", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            titulo: titulo,
            emailUsuario: emailUsuario,
            categoria: categoria,
            resumo: resumo
        })
    })
        .then(resposta => resposta.json())
        .then(dados => {
            fecharModalChamado();

            abrirModal(dados.mensagem);

            document.getElementById("titulo-chamado").value = "";
            document.getElementById("categoria-chamado").value = "";
            document.getElementById("descricao-chamado").value = "";
        });
}

function aceitarChamado(idChamado) {
    const emailTecnico = localStorage.getItem("usuarioLogado")

    fetch("http://127.0.0.1:5000/aceitar-chamado", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: emailTecnico,
            id: idChamado
        })
    })
        .then(resposta => resposta.json())
        .then(dados => {
            abrirModal(dados.mensagem);

            setTimeout(() => {
                window.location.href = "meus-chamados-tecnico.html";
            }, 1000);
        })
}

function recusarChamado(idChamado) {
    const emailTecnico = localStorage.getItem("usuarioLogado")

    fetch("http://127.0.0.1:5000/recusar-chamado", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: emailTecnico,
            id: idChamado
        })
    })
        .then(resposta => resposta.json())
        .then(dados => {
            abrirModal(dados.mensagem);

            setTimeout(() => {
                window.location.href = "meus-chamados-tecnico.html";
            }, 1000);
        })
}

function abrirModal(mensagem) {
    document.getElementById("mensagem-modal").innerText = mensagem;
    document.getElementById("modal").style.opacity = "1";
    document.getElementById("modal").style.visibility = "visible";
}

function fecharModal() {
    document.getElementById("modal").style.opacity = "0";
    document.getElementById("modal").style.visibility = "hidden";
}

function fecharCurriculo() {
    document.getElementById("modal-curriculo").style.opacity = "0";
    document.getElementById("modal-curriculo").style.visibility = "hidden";
}

function abrirModalChamado() {
    document.getElementById("modal-chamado").style.opacity = "1";
    document.getElementById("modal-chamado").style.visibility = "visible";
}

function fecharModalChamado() {
    document.getElementById("modal-chamado").style.opacity = "0";
    document.getElementById("modal-chamado").style.visibility = "hidden";
}

function fecharModalSolicitarTecnico() {
    document.getElementById("modal-solicitar-tecnico").style.opacity = "0";
    document.getElementById("modal-solicitar-tecnico").style.visibility = "hidden";
}

function sair() {
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("tipoUsuario");

    window.location.href = "pagelogin.html"
}

window.addEventListener("load", () => {
    if (document.getElementById("lista-tecnicos")) {
        carregarTecnicos();
    }

    if (document.getElementById("lista-chamados")) {
        carregarChamados();
    }

    if (document.getElementById("dados-conta")) {
        carregarDados();
    }

    if (document.getElementById("lista-meus-chamados")) {
        chamadosTecnico();
    }

    if (document.getElementById("lista-meus-chamados-cliente")) {
        chamadosCliente();
    }
});