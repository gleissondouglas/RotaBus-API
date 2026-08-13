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

## Fase 7: Overhaul de UI / Design System "RotaBus Apple" (🔄 Em Andamento)
Uma refatoração completa do visual do aplicativo para deixá-lo mais fluido, limpo e com sensação nativa (padrão Apple), focando fortemente no estilo Premium White Glass (Glassmorphism).
1. **Fluxo de Autenticação e Onboarding:** (✅ Concluído)
   - Substituição de "cards" opacos brancos por `LinearGradient` imersivo de ponta a ponta em todas as telas iniciais (`index`, `onboarding`, `login`, `criar-conta`, `esqueci-senha`, `permissoes`).
   - Refatoração dos ícones para utilizar padronização fina do `Ionicons` (outline).
   - Abandono de bordas retas (efeitos de caixa cortada pela SafeArea), utilizando `flex: 1` no background e absorvendo as margens apenas no conteúdo.
2. **Fluxo de Configurações e Perfil:** (🔮 Pendente)
   - Padronizar as telas de `acessibilidade`, `alterar-nome`, `alterar-senha` e menus com o mesmo efeito de UI imersiva.
3. **Fluxo Principal (Core Buscador):** (🔮 Pendente)
   - Refatoração imersiva das telas conversacionais e de navegação (`inicio`, `ouvindo`, `navegando`, `melhor-rota`, `confirmar-destino`).

## Fase 8: Rastreamento em Tempo Real e Operações (🔄 Em Andamento)
1. **Tempo Real (Crowdsourcing Waze-style):** (✅ Concluído) Utilização do aplicativo dos próprios passageiros como "Satélites" de GPS. Integrado com Redis no backend para desenhar os ônibus ao vivo na tela sem depender de APIs governamentais (GTFS-R).
2. **Painel CMS de Inteligência Local:** (🔮 Backlog) Um Web-App de dashboard para administradores gerenciarem a base de apelidos (`LocalIntelligence`), permitindo adicionar novos termos sem necessidade de novos deploys.

## Fase 9: Deploy e Homologação (🔮 Backlog)
1. **Migração Oficial e Deploy:** Colocar todas as renomeações do sistema ("RotaBus") nos servidores de produção (Render) de forma segura.
2. **Validação em Nuvem (End-to-end):** Rodar baterias de testes em dispositivos físicos (iOS e Android) consumindo dados da Nuvem Real (sem mock ou bypass local) para garantir o comportamento em condições de rede lentas (4G).

## Fase 10: Seleção de Múltiplas Rotas e Preferências (🔮 Backlog)
1. **Seleção de Rotas (Estilo Uber):** Em vez de retornar uma única "melhor rota", o backend fornecerá as 3 melhores opções (ex: "Mais Rápida", "Menos Caminhada", "Menos Baldeações"). O frontend exibirá essas opções como "cards" interativos para o usuário decidir qual se alinha mais à sua necessidade atual.
2. **Configurações de Preferência Pessoal:** Adição de configurações na conta do usuário (Perfil) para definir seu comportamento padrão (ex: "Sempre priorizar menor tempo de viagem" ou "Prefiro caminhar o mínimo possível"), que ajustará dinamicamente o *Comfort Score* (pesos do algoritmo) no backend.

## Fase 11: Refinamento Premium do Modo Escuro (🔮 Backlog)
1. **Profundidade Atmosférica (Midnight Gradient):** Substituir o fundo preto sólido/cinza tradicional por um degradê sutil e profundo (ex: do topo Preto-Azulado para o fundo Azul-Noturno), espelhando a lógica do Modo Claro (Branco para Azul-Claro). Isso cria a sensação orgânica de que "o app anoiteceu".
2. **Hierarquia de Luminância e Vidro Fosco:** Utilizar desfoque translúcido (Glassmorphism) para menus e modais inferiores flutuando sobre o mapa escuro. Elevação e relevo criados com tons de azul mais claros em vez de sombras pesadas.
3. **Contraste Confortável:** Substituir o texto "Branco Puro" por tons gelo ou prateados (`#F1F5F9` ou similares) para evitar "vibração" nas vistas e fadiga ocular, garantindo um design luxuoso, moderno e focado em acessibilidade noturna.
