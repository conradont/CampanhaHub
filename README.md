# CampanhaHub

Sistema web para **gerenciamento e monitoramento de campanhas de marketing digital** para pequenas empresas.

Projeto de TCC de Engenharia de Software, implementado a partir do documento de produção de software.

## O que o sistema faz

- Cadastro e autenticação de usuários
- Gestão de clientes, plataformas e campanhas
- Planejamento de conteúdos e calendário editorial
- Registro manual de métricas e investimentos
- Cálculo automático de **CPC**, **CTR**, **taxa de conversão**, CPM e engajamento
- Dashboard com gráficos
- Relatórios com exportação CSV e impressão
- Consulta de histórico de campanhas

A primeira versão **não integra** Instagram, Facebook ou Google Ads: as métricas são inseridas manualmente, como definido no escopo do TCC.

## Stack

### Front-end

| Tecnologia | Função |
|--------|------------|
| React | Construção da interface |
| TypeScript | Tipagem e segurança do código |
| Vite | Build e ambiente de desenvolvimento |
| Tailwind CSS | Estilização |
| shadcn/ui | Componentes de interface |
| React Router | Rotas |
| TanStack Query | Comunicação/cache da API |
| Axios | Requisições HTTP |
| React Hook Form | Formulários |
| Zod | Validação |
| Recharts | Gráficos do dashboard |
| Lucide React | Ícones |

### Back-end

| Tecnologia | Função |
|--------|------------|
| FastAPI | API REST |
| SQLAlchemy | Persistência |
| SQLite / PostgreSQL | Banco (dev / produção) |
| JWT | Autenticação |

## Como executar em desenvolvimento

### 1. Back-end

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API e Swagger: http://127.0.0.1:8000/docs

### 2. Front-end

```bash
cd frontend
npm install
npm run dev
```

Interface: http://localhost:5173

Para testar o painel com uma base completa (4 campanhas, 4 meses de métricas, gráficos e filtros):

```bash
cd backend
python -m app.seed
```

Entre com `conrado@campanhahub.dev` / `senha123`. O comando apaga os clientes/campanhas dessa conta e recarrega o conjunto mockado.

## Docker (PostgreSQL)

```bash
docker compose up --build
```

- Front-end: http://localhost:5173
- API: http://localhost:8000

## Testes

Os testes do dashboard usam o mesmo conjunto mockado (`backend/app/mock_data.py`), sem depender de dados digitados na interface.

```bash
cd backend
pytest
```

## Indicadores

O sistema distingue **métrica** (dado observado), **indicador** (cálculo no back-end) e **visualização** (gráfico no painel).

- **CPC** = investimento / cliques
- **CTR** = (cliques / impressões) × 100
- **Taxa de conversão** = (conversões / cliques) × 100

O painel consome `GET /api/dashboard` com filtros de período, cliente, campanha e plataforma. O CTR de cada ponto da série é calculado no FastAPI; o React só desenha o resultado.

## Estrutura

```
backend/     API FastAPI
frontend/    Interface React
```
