# CampanhaHub

Sistema web para **gerenciamento e monitoramento de campanhas de marketing digital** para pequenas empresas.

Projeto de TCC de Engenharia de Software, implementado a partir do documento de produção de software.

## O que o sistema faz

- Cadastro e autenticação de usuários
- Clientes com diagnóstico da marca: posicionamento, persona, quatro segmentações e SWOT
- Canais e campanhas, com objetivo, estratégia, meta numérica e referências
- Calendário editorial com responsável, forma de execução e custo estimado
- Registro manual de métricas, novos clientes e investimentos
- Cálculo automático de **CPC**, **CAC**, **CTR**, taxa de conversão, CPM e engajamento
- Funil de impressões, cliques e conversões no painel
- Palavras-chave e experimentos dentro da campanha
- Dashboard com gráficos
- Relatórios com exportação CSV e impressão
- Histórico de campanhas

A primeira versão **não integra** Instagram, Facebook ou Google Ads: as métricas são inseridas manualmente, como definido no escopo do TCC.

## Telas

As imagens abaixo usam a conta de demonstração (`python -m app.seed`).

### Entrar

![Tela de login](docs/screenshots/login.png)

### Painel

Investimento, histórico, CPC, CAC e o funil (impressões, cliques e conversões).

![Painel com CAC e funil](docs/screenshots/painel.png)

### Clientes

![Lista de clientes](docs/screenshots/clientes.png)

O cadastro guarda o contexto da marca, a persona, o público e a SWOT.

![Diagnóstico da marca no cliente](docs/screenshots/cliente-marca.png)

### Campanhas

![Fila de campanhas](docs/screenshots/campanhas.png)

Na campanha, a meta numérica aparece no cabeçalho. CPC e CAC ficam lado a lado, e a tabela de métricas inclui novos clientes.

![Detalhe da campanha Verão](docs/screenshots/campanha.png)

Palavras-chave e experimentos são abas da própria campanha.

![Aba de palavras-chave](docs/screenshots/palavras-chave.png)

![Aba de experimentos](docs/screenshots/experimentos.png)

### Calendário

![Calendário editorial](docs/screenshots/calendario.png)

Cada peça tem responsável, como executar e custo estimado.

![Edição de uma peça do calendário](docs/screenshots/calendario-peca.png)

### Canais

![Canais de distribuição](docs/screenshots/canais.png)

### Relatórios

A tabela compara CPC e CAC e pode ser exportada em CSV ou impressa.

![Relatórios com coluna de CAC](docs/screenshots/relatorios.png)

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
| slowapi | Rate limit (login, cadastro e API) |

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

O limite usa janela deslizante e a cota de quem já entrou é do usuário do token, não do IP — um Wi-Fi compartilhado não divide o saldo. Cada rota de navegação aceita **200/min** por pessoa. Login: **20/min por e-mail** e **60/min por IP**. Cadastro: **10/min por e-mail** e **30/min por IP**. Exportação CSV: **30/min**. Se estourar, a API responde 429 com `Retry-After` e pede para esperar alguns segundos. Em testes o limite fica desligado (`RATE_LIMIT_ENABLED=false`). Atrás de proxy, o IP anônimo vem de `X-Forwarded-For`.

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

## Banco no Supabase

O FastAPI já grava a **senha em bcrypt** (`hashed_password`). Campanhas, métricas e clientes ficam em texto porque o painel precisa filtrar e somar esses valores. O disco do Supabase ainda cifra o banco em repouso.

A integração GitHub/CLI lê `supabase/config.toml` e `supabase/migrations/` **na raiz do repositório**.

1. Crie um projeto em [supabase.com/dashboard](https://supabase.com/dashboard).
2. Em **Connect**, escolha **Session pooler** (porta `5432`, IPv4). Copie o **host exatamente** — não use `db.*.supabase.co` nem assuma `sa-east-1`.
3. No `backend`, copie `.env.example` para `.env` e preencha `DATABASE_HOST`, `DATABASE_USER` (`postgres.PROJECT_REF`) e `DATABASE_PASSWORD`.
4. Aplique as migrations:

```bash
npx supabase db push --yes --db-url "postgresql://postgres.PROJECT_REF:SENHA@HOST_DO_POOLER:5432/postgres?sslmode=require"
```

5. Confira a conexão:

```bash
cd backend
.\.venv\Scripts\python.exe -m app.check_db
```

Depois suba a API normalmente. O cadastro continua salvando só o hash da senha; a senha em claro nunca vai para o Postgres.

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
- **CAC** = investimento / novos clientes
- **CTR** = (cliques / impressões) × 100
- **Taxa de conversão** = (conversões / cliques) × 100

O funil do painel reúne impressões, cliques e conversões do período. O painel consome `GET /api/dashboard` com filtros de período, cliente, campanha e plataforma. O CTR de cada ponto da série é calculado no FastAPI; o React só desenha o resultado.

## Estrutura

```
backend/            API FastAPI
frontend/           Interface React
supabase/           config.toml e migrations (GitHub / CLI)
docs/screenshots/   imagens usadas neste README
```
