# RotaBus

![Badge](https://img.shields.io/badge/Status-Em_Desenvolvimento-blue)
![Architecture](https://img.shields.io/badge/Arquitetura-Monorepo-orange)
![Mobile](https://img.shields.io/badge/Frontend-React_Native_%2F_Expo-black)
![Backend](https://img.shields.io/badge/Backend-Node.js_%2F_Express-green)

O **RotaBus** (anteriormente chamado nuven) é um ecossistema de mobilidade urbana construído com foco em **Acessibilidade, Simplicidade (UI Touch-First) e Velocidade**. 

Nasceu para ajudar passageiros de transporte público a encontrarem a melhor rota para os seus destinos sem precisarem decifrar mapas complexos, letras miúdas ou interfaces poluídas (focado no Design "RotaBus Apple" edge-to-edge).

---

## 🏗 Estrutura do Monorepo

Este repositório principal orquestra todo o projeto e é dividido em duas grandes partes:

1. **[Frontend (App Mobile)](./frontend)**: Desenvolvido em React Native / Expo. Um aplicativo focado em acessibilidade e toques guiados, interface imersiva e limpa. Suporta navegação baseada em escolhas objetivas, abandonando a antiga navegação de IA Generativa por interações rápidas na tela.
2. **[Backend (API)](./backend)**: Desenvolvido em Node.js (Express), conectando-se a bancos Postgres (via Prisma) e Redis. Responsável por traduzir requisições rápidas para a **Google Routes/Places API**, processando regras locais (**Local Intelligence** e **Crowdsourcing**) de forma determinística e com latência mínima, zero custo com Inteligências Artificiais Generativas.

---

## 📚 Documentação (Wiki Local)

Todo o ecossistema é extensamente documentado. Se você for contribuir ou analisar a arquitetura, leia nossa pasta [`/docs`](./docs):

- **[00 - Visão Geral](./docs/00-VISAO-GERAL.md)**
- **[08 - A Abordagem Sem-IA e Inteligência Local](./docs/08-IA.md)**
- **[14 - Design System](./docs/14-DESIGN-SYSTEM.md)**
- **[18 - ROADMAP Atual e Futuro](./docs/18-ROADMAP.md)**

---

## 🚀 Como Iniciar (Ambiente Local)

Cada diretório possui suas dependências e variáveis de ambiente independentes (veja os arquivos `.env.example` em cada um).

1. Instale as dependências:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Rode os servidores locais:
   **Backend:** Precisa do Redis e Postgres em execução.
   ```bash
   cd backend
   npm run dev
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm run ios # (ou android)
   ```

*(Veja os arquivos README específicos dentro de `/backend` e `/frontend` para mais detalhes de testes e execução).*
