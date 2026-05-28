import psycopg2
from flask import Flask, request, jsonify
from flask_cors import CORS

conexao = psycopg2.connect(
    host="aws-1-us-west-2.pooler.supabase.com",
    database="postgres",
    user="postgres.yqwdgsloarwnsqacsvpw",
    password="HelpDesk2@26!",
    port="5432"
)

cursor = conexao.cursor()

print("Banco conectado com sucesso!")

app = Flask(__name__)
CORS(app)

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

    cursor.execute(
        """
        SELECT nome, email, senha, tipo
        FROM usuarios
        WHERE email = %s AND senha = %s
        """,
        (email, senha)
    )

    usuario = cursor.fetchone()

    if usuario:
        return jsonify({
            "sucesso": True,
            "mensagem": "Login realizado com sucesso!",
            "tipo": usuario[3]
        })

    return jsonify({
        "sucesso": False,
        "mensagem": "Usuário não encontrado ou senha incorreta"
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

    

    try:
        cursor.execute(
            """
            INSERT INTO usuarios
            (nome, email, telefone, cpf, senha, tipo)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (nome, email, telefone, cpf, senha, tipoUsuario)
        )

        conexao.commit()

        return jsonify({
            "sucesso": True,
            "mensagem": "Usuário cadastrado com sucesso"
        })

    except psycopg2.errors.UniqueViolation:
        conexao.rollback()

        return jsonify({
            "sucesso": False,
            "mensagem": "Email, telefone ou CPF já cadastrado"
        })

@app.route("/tecnicos", methods=["GET"])
def listar_tecnicos():

    cursor.execute(
        """
        SELECT nome, email, telefone, formacao,
            area, experiencia, resumo
        FROM usuarios
        WHERE tipo = 'tecnico'
        AND formacao != ''
        AND area != ''
        AND experiencia != ''
        AND resumo != ''
        """
    )

    tecnicos = cursor.fetchall()

    lista_tecnicos = []

    for tecnico in tecnicos:
        lista_tecnicos.append({
            "nome": tecnico[0],
            "email": tecnico[1],
            "telefone": tecnico[2],
            "formacao": tecnico[3],
            "area": tecnico[4],
            "experiencia": tecnico[5],
            "resumo": tecnico[6]
        })

    return jsonify(lista_tecnicos)

@app.route("/listar-chamados", methods=["GET"])
def listar_chamados():
    cursor.execute(
        """
        SELECT 
            chamados.id,
            chamados.titulo,
            chamados.categoria,
            chamados.resumo,
            chamados.status,
            usuarios.nome,
            usuarios.email,
            usuarios.telefone
        FROM chamados
        JOIN usuarios ON chamados.cliente_id = usuarios.id
        """
    )

    chamados_banco = cursor.fetchall()

    lista_chamados = []

    for chamado in chamados_banco:
        lista_chamados.append({
            "id": chamado[0],
            "titulo": chamado[1],
            "categoria": chamado[2],
            "resumo": chamado[3],
            "status": chamado[4],
            "nome": chamado[5],
            "email": chamado[6],
            "telefone": chamado[7]
        })

    return jsonify(lista_chamados)
    
@app.route("/salvar-perfil", methods=["POST"])
def salvar_perfil():
    dados = request.json

    email = dados.get("email")
    nome = dados.get("nome")
    formacao = dados.get("formacao")
    area = dados.get("area")
    experiencia = dados.get("experiencia")
    resumo = dados.get("resumo")

    cursor.execute(
        """
        UPDATE usuarios
        SET nome = %s,
            formacao = %s,
            area = %s,
            experiencia = %s,
            resumo = %s
        WHERE email = %s
        """,
        (nome, formacao, area, experiencia, resumo, email)
    )

    conexao.commit()

    if cursor.rowcount > 0:
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

    email = dados.get("emailUsuario")
    titulo = dados.get("titulo")
    categoria = dados.get("categoria")
    resumo = dados.get("resumo")

    cursor.execute(
        """
        SELECT id
        FROM usuarios
        WHERE email = %s
        """,
        (email,)
    )

    cliente = cursor.fetchone()

    if not cliente:
        return jsonify({
            "sucesso": False,
            "mensagem": "Cliente não encontrado"
        })

    cliente_id = cliente[0]

    cursor.execute(
        """
        INSERT INTO chamados
        (cliente_id, titulo, categoria, resumo, status)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (cliente_id, titulo, categoria, resumo, "pendente")
    )

    conexao.commit()

    return jsonify({
        "sucesso": True,
        "mensagem": "Ordem de Serviço aberta com sucesso!"
    })

@app.route("/meus-dados", methods=["POST"])
def vizualizar_dados():
    dados = request.json

    email = dados.get("email")

    cursor.execute(
        """
        SELECT nome, email, telefone, cpf, tipo
        FROM usuarios
        WHERE email = %s
        """,
        (email,)
    )

    usuario = cursor.fetchone()

    if usuario:
        return jsonify({
            "nome": usuario[0],
            "email": usuario[1],
            "telefone": usuario[2],
            "cpf": usuario[3],
            "tipo": usuario[4]
        })

    return jsonify({
        "sucesso": False,
        "mensagem": "Usuário não encontrado"
    })
 
@app.route("/aceitar-chamado", methods=["POST"])
def aceitar_chamado():
    dados = request.json

    idChamado = dados.get("id")
    emailTecnico = dados.get("email")

    cursor.execute(
        """
        SELECT id, nome
        FROM usuarios
        WHERE email = %s
        """,
        (emailTecnico,)
    )

    tecnico = cursor.fetchone()

    if not tecnico:
        return jsonify({
            "sucesso": False,
            "mensagem": "Técnico não encontrado"
        })

    tecnico_id = tecnico[0]
    nome_tecnico = tecnico[1]

    cursor.execute(
        """
        UPDATE chamados
        SET status = %s,
            tecnico_id = %s,
            nome_tecnico = %s
        WHERE id = %s
        """,
        ("aceito", tecnico_id, nome_tecnico, idChamado)
    )

    cursor.execute(
        """
        UPDATE solicitacoes
        SET status = %s
        WHERE chamado_id = %s
        AND tecnico_id = %s
        """,
        ("aceito", idChamado, tecnico_id)
    )

    conexao.commit()

    return jsonify({
        "sucesso": True,
        "mensagem": "Chamado aceito com sucesso!"
    })

@app.route("/meus-chamados-tecnico", methods=["POST"])
def listar_meus_chamados_tecnico():
    dados = request.json

    email = dados.get("email")

    cursor.execute(
        """
        SELECT
            chamados.id,
            chamados.titulo,
            chamados.categoria,
            chamados.resumo,
            chamados.status,
            usuarios.nome,
            usuarios.email,
            usuarios.telefone
        FROM solicitacoes

        JOIN chamados
            ON solicitacoes.chamado_id = chamados.id

        JOIN usuarios
            ON chamados.cliente_id = usuarios.id

        JOIN usuarios AS tecnico
            ON solicitacoes.tecnico_id = tecnico.id

        WHERE tecnico.email = %s
        """,
        (email,)
    )

    chamados_banco = cursor.fetchall()

    meus_chamados = []

    for chamado in chamados_banco:
        meus_chamados.append({
            "id": chamado[0],
            "titulo": chamado[1],
            "categoria": chamado[2],
            "resumo": chamado[3],
            "status": chamado[4],
            "nome": chamado[5],
            "email": chamado[6],
            "telefone": chamado[7]
        })

    return jsonify(meus_chamados)

@app.route("/meus-chamados-cliente", methods=["POST"])
def listar_meus_chamados_cliente():
    dados = request.json

    email = dados.get("email")

    cursor.execute(
        """
        SELECT
            chamados.id,
            chamados.titulo,
            chamados.categoria,
            chamados.resumo,
            chamados.status,
            usuarios.nome,
            usuarios.email,
            usuarios.telefone,
            tecnico.nome,
            tecnico.email
        FROM chamados
        JOIN usuarios ON chamados.cliente_id = usuarios.id
        LEFT JOIN usuarios AS tecnico ON chamados.tecnico_id = tecnico.id
        WHERE usuarios.email = %s
        """,
        (email,)
    )

    chamados_banco = cursor.fetchall()

    meus_chamados = []

    for chamado in chamados_banco:
        meus_chamados.append({
            "id": chamado[0],
            "titulo": chamado[1],
            "categoria": chamado[2],
            "resumo": chamado[3],
            "status": chamado[4],
            "nome": chamado[5],
            "email": chamado[6],
            "telefone": chamado[7],
            "nome_tecnico": chamado[8],
            "tecnico": chamado[9]
        })

    return jsonify(meus_chamados)

@app.route("/solicitar-tecnico", methods=["POST"])
def solicitar_tecnico():
    dados = request.json

    idChamado = dados.get("id")
    emailTecnico = dados.get("emailTecnico")

    cursor.execute(
        """
        SELECT id
        FROM usuarios
        WHERE email = %s AND tipo = 'tecnico'
        """,
        (emailTecnico,)
    )

    tecnico = cursor.fetchone()

    if not tecnico:
        return jsonify({
            "sucesso": False,
            "mensagem": "Técnico não encontrado"
        })

    tecnico_id = tecnico[0]

    cursor.execute(
        """
        SELECT status
        FROM solicitacoes
        WHERE chamado_id = %s AND tecnico_id = %s
        """,
        (idChamado, tecnico_id)
    )

    solicitacao = cursor.fetchone()

    if solicitacao:
        if solicitacao[0] == "recusado":
            return jsonify({
                "sucesso": False,
                "mensagem": "Este técnico já recusou esse chamado"
            })

        return jsonify({
            "sucesso": False,
            "mensagem": "Este técnico já foi solicitado"
        })

    cursor.execute(
        """
        INSERT INTO solicitacoes
        (chamado_id, tecnico_id, status)
        VALUES (%s, %s, %s)
        """,
        (idChamado, tecnico_id, "solicitado")
    )

    conexao.commit()

    return jsonify({
        "sucesso": True,
        "mensagem": "Solicitação realizada com sucesso!"
    })

@app.route("/recusar-chamado", methods=["POST"])
def recusar_chamado():
    dados = request.json

    idChamado = dados.get("id")
    emailTecnico = dados.get("email")

    cursor.execute(
        """
        SELECT id
        FROM usuarios
        WHERE email = %s
        """,
        (emailTecnico,)
    )

    tecnico = cursor.fetchone()

    if not tecnico:
        return jsonify({
            "sucesso": False,
            "mensagem": "Técnico não encontrado"
        })

    tecnico_id = tecnico[0]

    cursor.execute(
        """
        UPDATE solicitacoes
        SET status = %s
        WHERE chamado_id = %s AND tecnico_id = %s
        """,
        ("recusado", idChamado, tecnico_id)
    )

    conexao.commit()

    return jsonify({
        "sucesso": True,
        "mensagem": "Chamado recusado"
    })

@app.route("/buscar-tecnico", methods=["POST"])
def buscar_tecnico():
    dados = request.json

    email = dados.get("email")

    cursor.execute(
        """
        SELECT
            nome,
            email,
            telefone,
            formacao,
            area,
            experiencia,
            resumo
        FROM usuarios
        WHERE email = %s
        AND tipo = 'tecnico'
        """,
        (email,)
    )

    tecnico = cursor.fetchone()

    if tecnico:
        return jsonify({
            "nome": tecnico[0],
            "email": tecnico[1],
            "telefone": tecnico[2],
            "formacao": tecnico[3],
            "area": tecnico[4],
            "experiencia": tecnico[5],
            "resumo": tecnico[6]
        })

    return jsonify({
        "sucesso": False,
        "mensagem": "Técnico não encontrado"
    })

app.run(host="0.0.0.0", port=10000)