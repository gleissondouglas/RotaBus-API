# Roadmap e Evolução

O RotaBus nasceu como um app de rotas reativo e segue sua trajetória acelerada para o conceito de Assistente Proativo de Voz (Voice-First). Abaixo está o estado atual e o planejamento futuro.

## Fase 1: MVP Reactivo Inicial (✅ Concluído)
* Roteamento utilizando Google Routes puro.
* Transcrição TTS simplista isolada.
* O comando de voz era feito, porém em formato imperativo rígido ("Quero ir para X").

## Fase 2: Motor Conversacional Base (✅ Concluído)
* Criação do `SessionManager` e da `ConversationSession`.
* Migração de um comando unitário para fluxos estruturados (`POST /journeys/command`).
* Implementação do frontend React Native renderizando o payload JSON SDUI (Server-Driven UI).
* Mapeamento da camada Determinística Local (`LocalIntelligence`).

## Fase 3: Maturidade de Backend (✅ Concluído)
* Injeção de Proteção Financeira e Rate Limiters.
* Injeção do Zod Validator global.
* Migração da persistência FSM (Sessão) do Map (memória ram) para o Postgres (tolerante à falha em infraestrutura distribuída).
* Expansão da Resposta Conversacional com a integração `conversational.mapper.js`.
* ~~Integração de Contextualização com LLMs (Groq / LLaMA 3.1) no backend para análise temporal/complexa (`nlp.provider.js`)~~ (Removido: seleção de horário via voz foi substituída por UI Touch).

## Fase 4: Refinamento de Frontend Voice Loop (✅ Concluído)
* Ajuste no STT e TTS para aguardar a Promise de Finalização de Áudio (`speakAndWait`), sanando o loop infinito de gravação ruidosa.
* Aplicação rigorosa dos comandos de Voice-Intent determinísticos ("Sim", "A Primeira").
* UI de falha caso permissão de microfone não seja dada (Fallback puro-visual).
* Implementar navegação visual completa de rotas em blocos ("RouteStep") a partir da confirmação final do assistente.

## Fase 5: Expansão de Features Base (✅ Concluído)
* Implementação do fallback de caminhada (trajetos curtos calculados via Google Routes "WALK").
* Adição da interface compacta (BottomCard animado) para navegação com mapa maximizado.
* Integração de Autenticação Completa (Login, Cadastro e Redefinição de senha via provedor Resend).
* Criação de UI/UX dedicada para o modo "Apenas Caminhada".
* Refinamento do ciclo de vida do GPS do dispositivo (ex: Alarme de proximidade de descida).

## Fase 6: Sincronização e Proatividade (✅ Concluído)
1. **RotaBus (Sync de Dados):** Migração do Histórico e Locais Favoritos do armazenamento local (AsyncStorage) para o banco de dados (Prisma/Postgres) atrelado à conta do usuário logado.
2. **Push Notifications:** Integração com Expo Notifications para disparos proativos (ex: "Você está perto do ponto do ônibus 100, ele passa em 5 min.").
3. **Cache Offline-First:** Salvar rotas muito frequentes ("Ida p/ Casa") no dispositivo para permitir navegação ininterrupta em áreas sem 4G.

## Fase 7: Overhaul de UI / Design System "RotaBus Apple" (✅ Concluído)
Uma refatoração completa do visual do aplicativo para deixá-lo fluido, limpo e com sensação nativa (padrão Apple), com o estilo Premium White Glass (Glassmorphism), LinearGradients imersivos e ícones finos (`Ionicons`).
1. **Fluxo de Autenticação e Onboarding:** (✅ Concluído)
   - `index`, `onboarding`, `login`, `criar-conta`, `esqueci-senha`, `permissoes`.
2. **Fluxo de Configurações e Perfil:** (✅ Concluído)
   - `acessibilidade`, `alterar-nome`, `alterar-senha`, `configuracoes` e `ajuda`.
3. **Fluxo Principal (Core Buscador e Navegação):** (✅ Concluído)
   - `inicio`, `ouvindo`, `navegando`, `melhor-rota`, `confirmar-destino`, `escolher-horario`, `processando`.

## Fase 8: Rastreamento em Tempo Real e Operações (🔄 Em Andamento)
1. **Tempo Real (Crowdsourcing Waze-style com Sentido Ida/Volta):** (✅ Concluído) Utilização do app dos próprios passageiros como "Satélites" de GPS com diferenciação de sentido (headsign/direção) e badge pulsante verde de proximidade ("Ao vivo a X metros"). Integrado com Redis no backend para desenhar os ônibus ao vivo no mapa sem depender de APIs governamentais.
2. **Painel CMS de Inteligência Local:** (🔮 Backlog) Um Web-App de dashboard para administradores gerenciarem a base de apelidos (`LocalIntelligence`), permitindo adicionar novos termos sem necessidade de novos deploys.

## Fase 9: Deploy e Homologação (🔄 Em Andamento)
1. **Migração Oficial e Deploy:** Configurações seguras e deploys em produção (Render e Supabase).
2. **Validação em Nuvem (End-to-end):** Rodar baterias de testes em dispositivos físicos (iOS e Android) consumindo dados da Nuvem Real (sem mock ou bypass local).

## Fase 10: Seleção de Múltiplas Rotas e Preferências (✅ Concluído)
1. **Seleção de Rotas (Estilo Uber/Moovit):** (✅ Concluído) O backend classifica e marca as rotas candidatas com tags inteligentes (`Recomendada`, `Mais rápida`, `Menos caminhada`, `Linha direta`), e o frontend exibe um seletor interativo em carrossel horizontal de cards permitindo alternar a rota ativa, o mapa e a navegação em tempo real.
2. **Configurações de Preferência Pessoal:** Adição de configurações na conta do usuário (Perfil) para definir seu comportamento padrão (ex: "Sempre priorizar menor tempo de viagem" ou "Prefiro caminhar o mínimo possível"), que ajustará dinamicamente o *Comfort Score* (pesos do algoritmo) no backend.

## Fase 11: Refinamento Premium do Modo Escuro (✅ Concluído)
1. **Profundidade Atmosférica (Midnight Gradient):** Degradê sutil e profundo (Azul Noturno) com elevação orgânica adaptada ao tema escuro em todas as telas.
2. **Hierarquia de Luminância e Vidro Fosco:** Desfoque translúcido (Glassmorphism) para menus e cards flutuando sobre o mapa escuro.
3. **Contraste Confortável e Acessibilidade:** Cores ajustadas para evitar fadiga visual e garantir legibilidade ideal para idosos e baixa visão.
