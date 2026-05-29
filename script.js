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

    fetch("https://helpdesk-vnv7.onrender.com/cadastro", {
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
                window.location.href = "index.html";
            }
        });
}

function login() {
    const emailLogin = document.getElementById("email-login").value;
    const senhaLogin = document.getElementById("senha-login").value;

    fetch("https://helpdesk-vnv7.onrender.com/login", {
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

            localStorage.setItem("idUsuario", dados.id);
            localStorage.setItem("usuarioLogado", dados.email);
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
    const idTecnico = localStorage.getItem("idUsuario");

    const nome = document.getElementById("nome-tecnico").value;
    const formacao = document.getElementById("formacao-tecnico").value;
    const area = document.getElementById("area-tecnico").value;
    const experiencia = document.getElementById("experiencia-tecnico").value;
    const resumo = document.getElementById("resumo-tecnico").value;

    console.log(nome, formacao, area, experiencia, resumo);
    console.log("ID logado:", idTecnico);

    fetch("https://helpdesk-vnv7.onrender.com/salvar-perfil", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: idTecnico,
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
    const idUsuario = localStorage.getItem("idUsuario");

    fetch("https://helpdesk-vnv7.onrender.com/meus-dados", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: idUsuario
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
    fetch("https://helpdesk-vnv7.onrender.com/listar-chamados")
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
    fetch("https://helpdesk-vnv7.onrender.com/tecnicos")
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
    const idCliente = localStorage.getItem("idUsuario");

    const emailCliente = localStorage.getItem("usuarioLogado");

    fetch("https://helpdesk-vnv7.onrender.com/meus-chamados-cliente", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: idCliente
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

    fetch("https://helpdesk-vnv7.onrender.com/solicitar-tecnico", {
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
    fetch("https://helpdesk-vnv7.onrender.com/buscar-tecnico", {
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
    const idTecnico = localStorage.getItem("idUsuario");

    fetch("https://helpdesk-vnv7.onrender.com/meus-chamados-tecnico", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: idTecnico
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

                        ${chamado.status === "solicitado" ? `
                            <button onclick="aceitarChamado(${chamado.id})">
                                Aceitar
                            </button>

                            <button onclick="recusarChamado(${chamado.id})">
                                Recusar
                            </button>
                        ` : ""}

                        ${chamado.status === "aceito" ? `
                            <button onclick="finalizarChamado(${chamado.id})">
                                Finalizar chamado
                            </button>
                        ` : ""}

                        ${chamado.status === "aguardando_confirmacao" ? `
                            <p>
                                <strong>Aguardando confirmação do cliente</strong>
                            </p>
                        ` : ""}

                        ${chamado.status === "finalizado" ? `
                            <p>
                                <strong>Chamado finalizado</strong>
                            </p>
                        ` : ""}
                    </div>
                `;
            }).join("");
        })
}

function confirmarChamado(idChamado) {
    fetch("https://helpdesk-vnv7.onrender.com/confirmar-chamado", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: idChamado
        })
    })
        .then(resposta => resposta.json())
        .then(dados => {
            abrirModal(dados.mensagem);

            setTimeout(() => {
                window.location.href = "meus-chamados-cliente.html";
            }, 1000);
        });
}

function naoConfirmarChamado(idChamado) {
    fetch("https://helpdesk-vnv7.onrender.com/nao-confirmar-chamado", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: idChamado
        })
    })
        .then(resposta => resposta.json())
        .then(dados => {
            abrirModal(dados.mensagem);

            setTimeout(() => {
                window.location.href = "meus-chamados-cliente.html";
            }, 1000);
        });
}

function chamadosCliente() {
    const idCliente = localStorage.getItem("idUsuario");

    fetch("https://helpdesk-vnv7.onrender.com/meus-chamados-cliente", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: idCliente
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
                           ${chamado.tecnico
                        ? chamado.tecnico
                        : "Ainda não definido"
                    }
<br>

${chamado.nome_tecnico
                        ? chamado.nome_tecnico
                        : ""
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

                        ${chamado.status === "aguardando_confirmacao" ? `
                            <button onclick="confirmarChamado(${chamado.id})">
                                Confirmar serviço
                            </button>

                            <button onclick="naoConfirmarChamado(${chamado.id})">
                                Não confirmar
                            </button>
                        ` : ""}
                    </div>
                `;
            }).join("");
        });
}

function CriarChamado() {
    const idUsuario = localStorage.getItem("idUsuario");

    const titulo = document.getElementById("titulo-chamado").value;
    const categoria = document.getElementById("categoria-chamado").value;
    const resumo = document.getElementById("descricao-chamado").value;

    if (categoria === "" || resumo === "") {
        abrirModal("Selecione uma categoria e descreva ela")
        return;
    }

    fetch("https://helpdesk-vnv7.onrender.com/criar-chamado", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            titulo: titulo,
            idUsuario: idUsuario,
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
    const idTecnico = localStorage.getItem("idUsuario");

    fetch("https://helpdesk-vnv7.onrender.com/aceitar-chamado", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            idTecnico: idTecnico,
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
    const idTecnico = localStorage.getItem("idUsuario");

    fetch("https://helpdesk-vnv7.onrender.com/recusar-chamado", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            idTecnico: idTecnico,
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

function finalizarChamado(idChamado) {
    fetch("https://helpdesk-vnv7.onrender.com/finalizar-chamado", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: idChamado
        })
    })
        .then(resposta => resposta.json())
        .then(dados => {
            abrirModal(dados.mensagem);

            setTimeout(() => {
                window.location.href = "meus-chamados-tecnico.html";
            }, 1000);
        });
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
    localStorage.removeItem("idUsuario");
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("tipoUsuario");
    localStorage.removeItem("tecnicoSelecionado");

    window.location.href = "index.html";
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