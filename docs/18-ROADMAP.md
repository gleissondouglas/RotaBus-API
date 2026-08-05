# Roadmap e Evolução

O Nuvem nasceu como um app de rotas reativo e segue sua trajetória acelerada para o conceito de Assistente Proativo de Voz (Voice-First). Abaixo está o estado atual e o planejamento futuro.

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
* Integração de Contextualização com LLMs (Groq / LLaMA 3.1) no backend para análise temporal/complexa (`nlp.provider.js`).

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

## Fase 6: Sincronização e Proatividade (🔮 Planejado / Próximos Passos)
1. **Nuvem (Sync de Dados):** Migração do Histórico e Locais Favoritos do armazenamento local (AsyncStorage) para o banco de dados (Prisma/Postgres) atrelado à conta do usuário logado.
2. **Push Notifications:** Integração com Expo Notifications para disparos proativos (ex: "Você está perto do ponto do ônibus 100, ele passa em 5 min.").
3. **Cache Offline-First:** Salvar rotas muito frequentes ("Ida p/ Casa") no dispositivo para permitir navegação ininterrupta em áreas sem 4G.

## Fase 7: Gestão e Operações Especiais (🔮 Backlog Futuro)
1. **Painel CMS de Inteligência Local:** Um Web-App de dashboard para administradores gerenciarem a base de apelidos (`LocalIntelligence`), permitindo adicionar novos termos sem necessidade de novos deploys.
2. **Tempo Real (GTFS-R):** Conectar os dados de previsão estática ao sistema de rastreamento de GPS da frota local para atualizar os marcadores de ônibus com a posição real nas ruas.
