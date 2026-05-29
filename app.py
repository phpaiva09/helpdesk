import os
import psycopg2
from flask import Flask, request, jsonify
from flask_cors import CORS

conexao = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT"),
    sslmode="require"
)

cursor = conexao.cursor()

app = Flask(__name__)
CORS(app)


@app.route("/login", methods=["POST"])
def login():
    dados = request.json
    email = dados.get("email")
    senha = dados.get("senha")

    cursor.execute(
        """
        SELECT id, nome, email, tipo
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
            "id": usuario[0],
            "nome": usuario[1],
            "email": usuario[2],
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
    tipo = dados.get("tipo")

    if not nome or not email or not telefone or not cpf or not senha or not tipo:
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
            (nome, email, telefone, cpf, senha, tipo)
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
        SELECT nome, email, telefone, formacao, area, experiencia, resumo
        FROM usuarios
        WHERE tipo = 'tecnico'
        AND formacao IS NOT NULL AND formacao != ''
        AND area IS NOT NULL AND area != ''
        AND experiencia IS NOT NULL AND experiencia != ''
        AND resumo IS NOT NULL AND resumo != ''
        """
    )

    tecnicos = cursor.fetchall()

    lista = []

    for tecnico in tecnicos:
        lista.append({
            "nome": tecnico[0],
            "email": tecnico[1],
            "telefone": tecnico[2],
            "formacao": tecnico[3],
            "area": tecnico[4],
            "experiencia": tecnico[5],
            "resumo": tecnico[6]
        })

    return jsonify(lista)


@app.route("/salvar-perfil", methods=["POST"])
def salvar_perfil():
    dados = request.json

    id_usuario = dados.get("id")
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
        WHERE id = %s AND tipo = 'tecnico'
        """,
        (nome, formacao, area, experiencia, resumo, id_usuario)
    )

    conexao.commit()

    if cursor.rowcount > 0:
        return jsonify({
            "sucesso": True,
            "mensagem": "Perfil salvo com sucesso!"
        })

    return jsonify({
        "sucesso": False,
        "mensagem": "Perfil não salvo. Usuário não é técnico."
    })


@app.route("/meus-dados", methods=["POST"])
def meus_dados():
    dados = request.json
    id_usuario = dados.get("id")

    cursor.execute(
        """
        SELECT nome, email, telefone, cpf, tipo
        FROM usuarios
        WHERE id = %s
        """,
        (id_usuario,)
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


@app.route("/criar-chamado", methods=["POST"])
def criar_chamado():
    dados = request.json

    cliente_id = dados.get("idUsuario")
    titulo = dados.get("titulo")
    categoria = dados.get("categoria")
    resumo = dados.get("resumo")

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
        WHERE chamados.status = 'pendente'
        """
    )

    chamados = cursor.fetchall()

    lista = []

    for chamado in chamados:
        lista.append({
            "id": chamado[0],
            "titulo": chamado[1],
            "categoria": chamado[2],
            "resumo": chamado[3],
            "status": chamado[4],
            "nome": chamado[5],
            "email": chamado[6],
            "telefone": chamado[7]
        })

    return jsonify(lista)


@app.route("/meus-chamados-cliente", methods=["POST"])
def meus_chamados_cliente():
    dados = request.json
    id_cliente = dados.get("id")

    cursor.execute(
        """
        SELECT
            chamados.id,
            chamados.titulo,
            chamados.categoria,
            chamados.resumo,
            chamados.status,
            cliente.nome,
            cliente.email,
            cliente.telefone,
            tecnico.nome,
            tecnico.email
        FROM chamados
        JOIN usuarios AS cliente ON chamados.cliente_id = cliente.id
        LEFT JOIN usuarios AS tecnico ON chamados.tecnico_id = tecnico.id
        WHERE cliente.id = %s
        """,
        (id_cliente,)
    )

    chamados = cursor.fetchall()

    lista = []

    for chamado in chamados:
        lista.append({
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

    return jsonify(lista)


@app.route("/meus-chamados-tecnico", methods=["POST"])
def meus_chamados_tecnico():
    dados = request.json
    id_tecnico = dados.get("id")

    cursor.execute(
        """
        SELECT
            chamados.id,
            chamados.titulo,
            chamados.categoria,
            chamados.resumo,
            chamados.status,
            cliente.nome,
            cliente.email,
            cliente.telefone
        FROM solicitacoes
        JOIN chamados ON solicitacoes.chamado_id = chamados.id
        JOIN usuarios AS cliente ON chamados.cliente_id = cliente.id
        JOIN usuarios AS tecnico ON solicitacoes.tecnico_id = tecnico.id
        WHERE tecnico.id = %s
        AND solicitacoes.status != 'recusado'
        """,
        (id_tecnico,)
    )

    chamados = cursor.fetchall()

    lista = []

    for chamado in chamados:
        lista.append({
            "id": chamado[0],
            "titulo": chamado[1],
            "categoria": chamado[2],
            "resumo": chamado[3],
            "status": chamado[4],
            "nome": chamado[5],
            "email": chamado[6],
            "telefone": chamado[7]
        })

    return jsonify(lista)


@app.route("/solicitar-tecnico", methods=["POST"])
def solicitar_tecnico():
    dados = request.json

    id_chamado = dados.get("id")
    email_tecnico = dados.get("emailTecnico")

    cursor.execute(
        """
        SELECT id
        FROM usuarios
        WHERE email = %s AND tipo = 'tecnico'
        """,
        (email_tecnico,)
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
        (id_chamado, tecnico_id)
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
        (id_chamado, tecnico_id, "solicitado")
    )

    cursor.execute(
        """
        UPDATE chamados
        SET status = %s
        WHERE id = %s
        """,
        ("solicitado", id_chamado)
    )


    conexao.commit()

    return jsonify({
        "sucesso": True,
        "mensagem": "Solicitação realizada com sucesso!"
    })


@app.route("/aceitar-chamado", methods=["POST"])
def aceitar_chamado():
    dados = request.json

    id_chamado = dados.get("id")
    id_tecnico = dados.get("idTecnico")

    cursor.execute(
        """
        SELECT nome
        FROM usuarios
        WHERE id = %s AND tipo = 'tecnico'
        """,
        (id_tecnico,)
    )

    tecnico = cursor.fetchone()

    if not tecnico:
        return jsonify({
            "sucesso": False,
            "mensagem": "Técnico não encontrado"
        })

    nome_tecnico = tecnico[0]

    cursor.execute(
        """
        UPDATE chamados
        SET status = %s,
            tecnico_id = %s,
            nome_tecnico = %s
        WHERE id = %s
        """,
        ("aceito", id_tecnico, nome_tecnico, id_chamado)
    )

    cursor.execute(
        """
        UPDATE solicitacoes
        SET status = %s
        WHERE chamado_id = %s
        AND tecnico_id = %s
        """,
        ("aceito", id_chamado, id_tecnico)
    )

    conexao.commit()

    return jsonify({
        "sucesso": True,
        "mensagem": "Chamado aceito com sucesso!"
    })


@app.route("/recusar-chamado", methods=["POST"])
def recusar_chamado():
    dados = request.json

    id_chamado = dados.get("id")
    id_tecnico = dados.get("idTecnico")

    cursor.execute(
        """
        UPDATE solicitacoes
        SET status = %s
        WHERE chamado_id = %s AND tecnico_id = %s
        """,
        ("recusado", id_chamado, id_tecnico)
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
        SELECT nome, email, telefone, formacao, area, experiencia, resumo
        FROM usuarios
        WHERE email = %s AND tipo = 'tecnico'
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


@app.route("/finalizar-chamado", methods=["POST"])
def finalizar_chamado():
    dados = request.json
    id_chamado = dados.get("id")

    cursor.execute(
        """
        UPDATE chamados
        SET status = %s
        WHERE id = %s
        """,
        ("aguardando_confirmacao", id_chamado)
    )

    conexao.commit()

    return jsonify({
        "sucesso": True,
        "mensagem": "Chamado enviado para confirmação do cliente!"
    })


@app.route("/confirmar-chamado", methods=["POST"])
def confirmar_chamado():
    dados = request.json
    id_chamado = dados.get("id")

    cursor.execute(
        """
        UPDATE chamados
        SET status = %s
        WHERE id = %s
        """,
        ("finalizado", id_chamado)
    )

    conexao.commit()

    return jsonify({
        "sucesso": True,
        "mensagem": "Chamado finalizado com sucesso!"
    })


@app.route("/nao-confirmar-chamado", methods=["POST"])
def nao_confirmar_chamado():
    dados = request.json
    id_chamado = dados.get("id")

    cursor.execute(
        """
        UPDATE chamados
        SET status = %s
        WHERE id = %s
        """,
        ("aceito", id_chamado)
    )

    conexao.commit()

    return jsonify({
        "sucesso": True,
        "mensagem": "Chamado retornou para o técnico!"
    })


app.run(host="0.0.0.0", port=10000)