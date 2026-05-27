from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

usuarios = []
chamados = []

@app.route("/login", methods=["POST"])
def login():
    dados = request.json

    email = dados.get("email")
    senha = dados.get("senha")

    if not email or not senha:
        return jsonify({
            "sucesso": False,
            "mensagem": "Preencha todos os campos",
        })

    for usuario in usuarios:
        if usuario["email"] == email and usuario["senha"] == senha:
            return jsonify({
                "sucesso": True,
                "mensagem": "Login realizado com sucesso!",
                "tipo": usuario["tipo"]
            })

    return({
        "sucesso": False,
        "mensagem": "Usuário não encontrado ou senha incorreta",
    }) 

@app.route("/cadastro", methods=["POST"])
def cadastro():
    dados = request.json

    nome = dados.get("nome")
    email = dados.get("email")
    telefone = dados.get("telefone")
    cpf = dados.get("cpf")
    senha = dados.get("senha")
    tipoUsuario = dados.get("tipo")

    if not nome or not email or not telefone or not cpf or not senha or not tipoUsuario:
        return jsonify({
            "sucesso": False,
            "mensagem": "Preencha todos os campos"
        })

    for usuario_cadastrado in usuarios:
        if usuario_cadastrado["email"] == email:
            return jsonify({
                "sucesso": False,
                "mensagem": "Email já cadastrado"
            })
        
        if usuario_cadastrado["telefone"] == telefone:
            return jsonify({
                "sucesso": False,
                "mensagem": "Telefone já cadastrado"
            })
        
        if usuario_cadastrado["cpf"] == cpf:
            return jsonify({
                "sucesso": False,
                "mensagem": "CPF já cadastrado"
            })

    usuario = {
        "nome": nome,
        "email": email,
        "telefone": telefone,
        "cpf": cpf,
        "senha": senha,
        "tipo": tipoUsuario,
        "avaliacoes": []
    }

    usuarios.append(usuario)

    print(usuarios)

    return jsonify({
        "sucesso": True,
        "mensagem": "Usuário cadastrado com sucesso"
    })

@app.route("/tecnicos", methods=["GET"])
def listar_tecnicos():
    tecnicos = []

    for tecnico in usuarios:
        if tecnico["tipo"] == "tecnico" and tecnico.get("formacao") and tecnico.get("area") and tecnico.get("experiencia") and tecnico.get("resumo"):
        

            if len(tecnico["avaliacoes"]) > 0:
                media = sum(tecnico["avaliacoes"]) / len(tecnico["avaliacoes"])
            else:
                media = None

            tecnico["media_avaliacao"] = media

            tecnicos.append(tecnico)
        
    return jsonify(tecnicos)

@app.route("/listar-chamados", methods=["GET"])
def listar_chamados():

    return jsonify(chamados)
    
@app.route("/salvar-perfil", methods=["POST"])
def salvar_perfil():
    dados = request.json

    email = dados.get("email")
    nome = dados.get("nome")
    formacao = dados.get("formacao")
    area = dados.get("area")
    experiencia = dados.get("experiencia")
    resumo = dados.get("resumo")

    print("EMAIL RECEBIDO:", email)
    print("USUARIOS:", usuarios)

    for usuario in usuarios:
        if usuario["email"] == email:
            usuario["nome"] = nome
            usuario["formacao"] = formacao
            usuario["area"] = area
            usuario["experiencia"] = experiencia
            usuario["resumo"] = resumo
            print("USUARIO ENCONTRADO")
        
            return jsonify({
                "sucesso": True,
                "mensagem": "Perfil salvo com sucesso!"
            })
        
    return jsonify({
        "sucesso": False,
        "mensagem": "Técnico não encontrado"
    })

@app.route("/criar-chamado", methods=["POST"])
def criar_chamado():
    dados = request.json

    id_chamado = len(chamados) + 1
    email = dados.get("emailUsuario")
    titulo = dados.get("titulo")
    categoria = dados.get("categoria")
    resumo = dados.get("resumo")
    telefone = dados.get("telefone")

    for usuario in usuarios:
        if usuario["email"] == email:
            nome = usuario["nome"]
            telefone = usuario["telefone"]

    chamado = {
        "id": id_chamado,
        "nome": nome,
        "email": email,
        "telefone": telefone,
        "titulo": titulo,
        "categoria": categoria,
        "resumo": resumo,
        "status": "pendente",
        "tecnico": None,
        "tecnicos_solicitados": [],
        "tecnicos_recusaram": []
    }

    chamados.append(chamado)

    return jsonify({
        "sucesso": True,
        "mensagem": "Ordem de Serviço aberta com sucesso!"
    })

@app.route("/meus-dados", methods=["POST"])
def vizualizar_dados():
    dados = request.json

    email = dados.get("email")

    for usuario in usuarios:
        if usuario["email"] == email:
            return jsonify(usuario)

    return jsonify({
        "sucesso": False,
        "mensagem": "Usuário não encontardo"
    })
 
@app.route("/aceitar-chamado", methods=["POST"])
def aceitar_chamado():
    dados = request.json

    idChamado = dados.get("id")
    emailTecnico = dados.get("email")

    nomeTecnico = ""

    for usuario in usuarios:
        if usuario["email"] == emailTecnico:
            nomeTecnico = usuario["nome"]

    for chamado in chamados:
        if chamado["id"] == idChamado:
            chamado["status"] = "aceito"
            chamado["tecnico"] = emailTecnico
            chamado["nome_tecnico"] = nomeTecnico
            chamado["tecnicos_solicitados"] = []

            return jsonify({
                "sucesso": True,
                "mensagem": "Chamado aceito com sucesso!"
            })

@app.route("/meus-chamados-tecnico", methods=["POST"])
def listar_meus_chamados_tecnico():
    dados = request.json

    email = dados.get("email")

    meus_chamados = []

    for chamado in chamados:
        if email in chamado["tecnicos_solicitados"] or chamado["tecnico"] == email:
            meus_chamados.append(chamado)

    return jsonify(meus_chamados)

@app.route("/meus-chamados-cliente", methods=["POST"])
def listar_meus_chamados_cliente():
    dados = request.json

    email = dados.get("email")

    meus_chamados = []

    for chamado in chamados:
        if chamado["email"] == email:
            meus_chamados.append(chamado)

    return jsonify(meus_chamados)

@app.route("/solicitar-tecnico", methods=["POST"])
def solicitar_tecnico():
    dados = request.json

    idChamado = dados.get("id")
    emailTecnico = dados.get("emailTecnico")
    nomeTecnico = None

    for usuario in usuarios:
        if usuario["email"] == emailTecnico:
            nomeTecnico = usuario["nome"]

    for chamado in chamados:
        if chamado["id"] == idChamado:
            if emailTecnico in chamado["tecnicos_recusaram"]:
                return jsonify({
                    "sucesso": False,
                    "mensagem": "Este técnico já recusou esse chamado"
                })
            
            if emailTecnico in chamado["tecnicos_solicitados"]:
                return jsonify({
                    "sucesso": False,
                    "mensagem": "Este técnico já foi solicitado"
                })

            chamado["tecnicos_solicitados"].append(emailTecnico)

            return jsonify ({
                "sucesso": True,
                "mensagem": "Solicitação realizada com sucesso!"
            })

@app.route("/recusar-chamado", methods=["POST"])
def recusar_chamado():
    dados = request.json

    idChamado = dados.get("id")
    emailTecnico = dados.get("email")

    for chamado in chamados:
        if chamado["id"] == idChamado:
            chamado["status"] = "pendente"
            chamado["tecnicos_recusaram"].append(emailTecnico)
            chamado["tecnico"] = None
            
            if emailTecnico in chamado["tecnicos_solicitados"]:
                chamado["tecnicos_solicitados"].remove(emailTecnico)

            return jsonify ({
                "sucesso": True,
                "mensagem": "Chamado recusado"
            })

@app.route("/buscar-tecnico", methods=["POST"])
def buscar_tecnico():
    dados = request.json

    email = dados.get("email")

    for usuario in usuarios:
        if usuario["email"] == email and usuario["tipo"] == "tecnico":

            return jsonify(usuario)
    return jsonify({
        "sucesso": False,
        "mensagem": "Técnico não encontrado"
    })

app.run(debug=True)