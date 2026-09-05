# Memória da Inteligência Artificial (Contexto Persistido)

> Este arquivo é um registro contínuo para que a IA leia em sessões futuras e saiba rapidamente quais foram as implementações de sucesso concluídas e validadas no passado, mantendo o contexto vivo e evitando retrabalho.

## 🚀 Implementações Concluídas e Aprovadas (Sessão de Setembro 2026)

### 1. Sistema de Cache Distribuído com Redis (Backend)
- **O que foi feito:** Otimização pesada das chamadas de API externas da Google Cloud. Implementado cache via `ioredis` para `geocode:reverse`, `geocode:forward`, `places:search`, `route:sched` e `speech:transcribe`.
- **Estratégia:** Tempo de vida (TTL) otimizado (ex: 30 dias para locais, arredondamento de coordenadas em 4 casas decimais para maximizar cache hits).
- **Status:** 100% testado e aprovado. Passou em todas as suítes (Service e Utils do Redis criados).

### 2. Notificações e Tarefas de Background (Backend + Frontend)
- **O que foi feito:** Base para disparar eventos assíncronos (como lembretes de viagem ou avisos de chegada de ônibus).
- **Backend:** Agendamento de eventos no Redis que processam filas para disparar Push.
- **Frontend:** Configuração completa do `expo-notifications` para reagir a mensagens em background e foreground.
- **Status:** 100% testado e aprovado com simulações.

### 3. Mapa: Redesign de UI e Correções de Câmera/Zoom (Frontend)
- **Correção Crítica de Câmera (Preview):** O MapKit do iOS quebrava ao receber `fitToCoordinates` em Cards pequenos (Preview). Foi solucionado calculando dinamicamente o *Bounding Box* geográfico no Javascript e usando `animateToRegion` (com folga óptica) em vez das funções problemáticas do MapKit.
- **Nível de Rua (Street-Level Zoom):** O mapa agora dá um super zoom (`delta: 0.0015`) para orientar precisamente usuários em trechos de caminhada curtos (menores que 400m).
- **Redesign dos Caminhos (Halo Track):** A rota a pé foi refeita com um efeito "Halo" moderno (uma linha translúcida de fundo de 12px e pontos sólidos arredondados de 6px por cima, usando `lineDashPattern: [0, 16]`).
- **Pins de Ponto de Ônibus:** Modificado de uma esfera genérica para um Pin Moderno Flutuante com cápsula, badge, e agulha precisa para marcar o lado exato da calçada.
- **Status:** Aprovado visualmente pelo usuário via screenshots. 0 erros de Typescript/Lint no frontend.

### 4. Estado da Cobertura de Testes
- **Backend:** 38 suítes e 278 testes rodando com 100% de aprovação. Nenhum mock quebrado ou dependência viciada no Banco.
- **Frontend:** 43 suítes e 375 testes rodando com 100% de aprovação. Typecheck (tsc) limpo (Zero erros).

---
*Nota da IA para a IA:* Não reconstrua o cache do Redis nem recrie a lógica de enquadramento (Bounding Box / Zoom Street-Level) do mapa. Elas estão maduras. Quando desenvolver novos componentes de interface, siga rigorosamente os tokens mapeados no `docs/14-DESIGN-SYSTEM.md`. Quando mexer no servidor, siga as regras de Clean Architecture do projeto (Repositories isolados).
