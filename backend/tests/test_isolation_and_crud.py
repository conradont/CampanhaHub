"""Isolamento entre contas (BOLA/IDOR) e ciclo CRUD dos routers de cadastro."""
import uuid

import pytest

from app.indicators import calc_cpc
from tests.conftest import client

HOJE = "2026-06-01"


def _novo_usuario():
    email = f"user-{uuid.uuid4().hex[:10]}@campanhahub.dev"
    resp = client.post(
        "/api/auth/register",
        json={"name": "Outro Usuário", "email": email, "password": "senha123"},
    )
    assert resp.status_code == 201
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest.fixture
def intruso():
    return _novo_usuario()


@pytest.fixture
def recursos(mock_user):
    """Cria um conjunto completo de recursos para o dono (mock_user)."""
    headers = mock_user["headers"]
    seeded = mock_user["seeded"]
    campaign_id = seeded.campaigns["Verão"]
    ids = {"campaign": campaign_id, "client": next(iter(seeded.clients.values()))}
    ids["metric"] = client.post(
        "/api/metrics",
        headers=headers,
        json={"campaign_id": campaign_id, "date": HOJE, "clicks": 10, "investment": 20},
    ).json()["id"]
    ids["content"] = client.post(
        "/api/contents",
        headers=headers,
        json={"campaign_id": campaign_id, "title": "Post de teste", "scheduled_date": HOJE},
    ).json()["id"]
    ids["expense"] = client.post(
        "/api/expenses",
        headers=headers,
        json={"campaign_id": campaign_id, "description": "Anúncio", "amount": 15, "date": HOJE},
    ).json()["id"]
    ids["keyword"] = client.post(
        "/api/keywords",
        headers=headers,
        json={"campaign_id": campaign_id, "term": "palavra de teste"},
    ).json()["id"]
    ids["experiment"] = client.post(
        "/api/experiments",
        headers=headers,
        json={"campaign_id": campaign_id, "hypothesis": "Hipótese de teste"},
    ).json()["id"]
    ids["platform"] = client.get("/api/platforms", headers=headers).json()[0]["id"]
    return ids


# ---------------------------------------------------------------- isolamento
@pytest.mark.parametrize(
    "caminho,chave",
    [
        ("/api/clients/{}", "client"),
        ("/api/campaigns/{}", "campaign"),
        ("/api/campaigns/{}/summary", "campaign"),
    ],
)
def test_outro_usuario_nao_le_recurso_alheio(recursos, intruso, caminho, chave):
    resposta = client.get(caminho.format(recursos[chave]), headers=intruso)
    assert resposta.status_code == 404


def test_listagens_do_intruso_nao_vazam_dados(recursos, intruso):
    for caminho in (
        "/api/campaigns",
        "/api/metrics",
        "/api/contents",
        "/api/expenses",
        "/api/keywords",
        "/api/experiments",
    ):
        resposta = client.get(caminho, headers=intruso)
        assert resposta.status_code == 200
        assert resposta.json() == [], caminho


def test_intruso_nao_altera_nem_apaga_recursos_alheios(recursos, intruso):
    corpo_cliente = {"name": "Invasor"}
    assert client.put(f"/api/clients/{recursos['client']}", headers=intruso, json=corpo_cliente).status_code == 404
    assert client.delete(f"/api/clients/{recursos['client']}", headers=intruso).status_code == 404
    assert client.delete(f"/api/campaigns/{recursos['campaign']}", headers=intruso).status_code == 404
    assert client.delete(f"/api/metrics/{recursos['metric']}", headers=intruso).status_code == 404
    assert client.delete(f"/api/contents/{recursos['content']}", headers=intruso).status_code == 404
    assert client.delete(f"/api/expenses/{recursos['expense']}", headers=intruso).status_code == 404
    assert client.delete(f"/api/keywords/{recursos['keyword']}", headers=intruso).status_code == 404
    assert client.delete(f"/api/experiments/{recursos['experiment']}", headers=intruso).status_code == 404
    assert client.delete(f"/api/platforms/{recursos['platform']}", headers=intruso).status_code == 404


def test_intruso_nao_cria_registros_em_campanha_alheia(recursos, intruso):
    campanha = recursos["campaign"]
    casos = [
        ("/api/metrics", {"campaign_id": campanha, "date": HOJE}),
        ("/api/contents", {"campaign_id": campanha, "title": "Invasor", "scheduled_date": HOJE}),
        ("/api/expenses", {"campaign_id": campanha, "description": "Invasor", "amount": 1, "date": HOJE}),
        ("/api/keywords", {"campaign_id": campanha, "term": "invasor"}),
        ("/api/experiments", {"campaign_id": campanha, "hypothesis": "Invasor"}),
    ]
    for caminho, corpo in casos:
        assert client.post(caminho, headers=intruso, json=corpo).status_code == 404, caminho


def test_intruso_nao_cria_campanha_com_cliente_alheio(recursos, intruso):
    plataforma_propria = client.get("/api/platforms", headers=intruso).json()[0]["id"]
    resposta = client.post(
        "/api/campaigns",
        headers=intruso,
        json={
            "name": "Campanha invasora",
            "client_id": recursos["client"],
            "platform_id": plataforma_propria,
            "start_date": HOJE,
        },
    )
    assert resposta.status_code == 400


def test_dashboard_e_relatorio_do_intruso_ficam_vazios(recursos, intruso):
    painel = client.get("/api/dashboard?period=all", headers=intruso).json()
    assert painel["overview"]["total_campaigns"] == 0
    csv_resposta = client.get("/api/reports/export.csv", headers=intruso)
    assert csv_resposta.status_code == 200
    assert len(csv_resposta.text.strip().splitlines()) <= 1  # apenas cabeçalho


# ------------------------------------------------------------- autenticação
def test_login_com_senha_incorreta_retorna_401(mock_user):
    resposta = client.post(
        "/api/auth/login",
        json={"email": "mock-dashboard@campanhahub.dev", "password": "senha-errada"},
    )
    assert resposta.status_code == 401


def test_cadastro_com_email_duplicado_retorna_400(mock_user):
    resposta = client.post(
        "/api/auth/register",
        json={"name": "Duplicado", "email": "mock-dashboard@campanhahub.dev", "password": "senha123"},
    )
    assert resposta.status_code == 400


def test_rotas_protegidas_exigem_token_valido():
    assert client.get("/api/clients").status_code in (401, 403)
    resposta = client.get("/api/clients", headers={"Authorization": "Bearer token-invalido"})
    assert resposta.status_code == 401


def test_me_retorna_usuario_autenticado(mock_user):
    resposta = client.get("/api/auth/me", headers=mock_user["headers"])
    assert resposta.status_code == 200
    assert resposta.json()["email"] == "mock-dashboard@campanhahub.dev"


# ------------------------------------------------------- divisão por zero
def test_cpc_nulo_quando_nao_ha_cliques(mock_user):
    campanha = mock_user["seeded"].campaigns["Verão"]
    resposta = client.post(
        "/api/metrics",
        headers=mock_user["headers"],
        json={"campaign_id": campanha, "date": HOJE, "clicks": 0, "investment": 100},
    )
    assert resposta.status_code == 201
    indicadores = resposta.json()["indicators"]
    assert indicadores["cpc"] is None
    assert calc_cpc(100, 0) is None


# --------------------------------------------------------------------- CRUD
def test_ciclo_crud_de_cliente(mock_user):
    headers = mock_user["headers"]
    criado = client.post("/api/clients", headers=headers, json={"name": "Cliente CRUD", "segment": "Varejo"})
    assert criado.status_code == 201
    cid = criado.json()["id"]
    assert client.get(f"/api/clients/{cid}", headers=headers).json()["segment"] == "Varejo"
    atualizado = client.put(f"/api/clients/{cid}", headers=headers, json={"name": "Cliente CRUD", "segment": "Moda"})
    assert atualizado.json()["segment"] == "Moda"
    assert any(c["id"] == cid for c in client.get("/api/clients", headers=headers).json())
    assert client.delete(f"/api/clients/{cid}", headers=headers).status_code == 204
    assert client.get(f"/api/clients/{cid}", headers=headers).status_code == 404


def test_ciclo_crud_de_plataforma(mock_user):
    headers = mock_user["headers"]
    criada = client.post("/api/platforms", headers=headers, json={"name": "Canal CRUD", "description": "teste"})
    assert criada.status_code == 201
    pid = criada.json()["id"]
    assert client.post("/api/platforms", headers=headers, json={"name": "Canal CRUD"}).status_code == 400
    editada = client.put(f"/api/platforms/{pid}", headers=headers, json={"name": "Canal Editado"})
    assert editada.json()["name"] == "Canal Editado"
    assert client.delete(f"/api/platforms/{pid}", headers=headers).status_code == 204


def test_ciclo_crud_de_campanha_com_resumo(mock_user):
    headers = mock_user["headers"]
    seeded = mock_user["seeded"]
    corpo = {
        "name": "Campanha CRUD",
        "client_id": next(iter(seeded.clients.values())),
        "platform_id": client.get("/api/platforms", headers=headers).json()[0]["id"],
        "start_date": HOJE,
        "budget": 1000,
        "goal_metric": "cliques",
        "goal_value": 100,
    }
    criada = client.post("/api/campaigns", headers=headers, json=corpo)
    assert criada.status_code == 201
    cid = criada.json()["id"]
    client.post(
        "/api/metrics",
        headers=headers,
        json={"campaign_id": cid, "date": HOJE, "clicks": 50, "investment": 250},
    )
    resumo = client.get(f"/api/campaigns/{cid}/summary", headers=headers).json()
    assert resumo["goal"]["actual"] == 50
    assert resumo["goal"]["progress_percent"] == 50.0
    assert resumo["budget_used_percent"] == 25.0
    corpo["status"] = "ativa"
    assert client.put(f"/api/campaigns/{cid}", headers=headers, json=corpo).json()["status"] == "ativa"
    assert any(c["id"] == cid for c in client.get("/api/campaigns?status=ativa", headers=headers).json())
    assert client.delete(f"/api/campaigns/{cid}", headers=headers).status_code == 204


def test_ciclo_crud_de_metricas_conteudos_e_despesas(recursos, mock_user):
    headers = mock_user["headers"]
    campanha = recursos["campaign"]

    metrica = client.put(
        f"/api/metrics/{recursos['metric']}",
        headers=headers,
        json={"campaign_id": campanha, "date": HOJE, "clicks": 40, "investment": 80},
    )
    assert metrica.status_code == 200 and metrica.json()["clicks"] == 40
    assert client.get(f"/api/metrics?campaign_id={campanha}", headers=headers).status_code == 200
    assert client.delete(f"/api/metrics/{recursos['metric']}", headers=headers).status_code == 204

    conteudo = client.put(
        f"/api/contents/{recursos['content']}",
        headers=headers,
        json={"campaign_id": campanha, "title": "Título novo", "scheduled_date": HOJE, "estimated_cost": 30},
    )
    assert conteudo.status_code == 200 and conteudo.json()["title"] == "Título novo"
    filtrados = client.get(f"/api/contents?campaign_id={campanha}&start=2026-01-01&end=2026-12-31", headers=headers)
    assert any(c["id"] == recursos["content"] for c in filtrados.json())
    assert client.delete(f"/api/contents/{recursos['content']}", headers=headers).status_code == 204

    despesa = client.put(
        f"/api/expenses/{recursos['expense']}",
        headers=headers,
        json={"campaign_id": campanha, "description": "Anúncio 2", "amount": 22, "date": HOJE},
    )
    assert despesa.status_code == 200 and despesa.json()["amount"] == 22
    assert client.get(f"/api/expenses?campaign_id={campanha}", headers=headers).status_code == 200
    assert client.delete(f"/api/expenses/{recursos['expense']}", headers=headers).status_code == 204


def test_remocao_de_palavra_chave_e_experimento(recursos, mock_user):
    headers = mock_user["headers"]
    campanha = recursos["campaign"]
    assert client.get(f"/api/keywords?campaign_id={campanha}", headers=headers).status_code == 200
    assert client.get(f"/api/experiments?campaign_id={campanha}", headers=headers).status_code == 200
    assert client.delete(f"/api/keywords/{recursos['keyword']}", headers=headers).status_code == 204
    assert client.delete(f"/api/experiments/{recursos['experiment']}", headers=headers).status_code == 204


def test_validacao_rejeita_dados_invalidos(mock_user):
    headers = mock_user["headers"]
    assert client.post("/api/clients", headers=headers, json={"name": "A"}).status_code == 422
    campanha = mock_user["seeded"].campaigns["Verão"]
    despesa_invalida = {"campaign_id": campanha, "description": "Teste", "amount": 0, "date": HOJE}
    assert client.post("/api/expenses", headers=headers, json=despesa_invalida).status_code == 422
