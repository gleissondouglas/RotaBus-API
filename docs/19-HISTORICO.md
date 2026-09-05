# Histórico e Decisões Arquiteturais (ADRs)

Este documento registra as principais escolhas técnicas do projeto e os motivos que levaram a essas direções ao longo da história do RotaBus (RotaBus-API).

## ADR-001: Monólito Modular
- **Contexto:** Havia um debate sobre fragmentar as integrações Google Routes em Microsserviços para facilitar o versionamento isolado de IA.
- **Decisão:** Manter um Monólito Modular Node.js (Express).
- **Justificativa:** Overengineering. Para o time atual, gerir complexidade de rede entre microsserviços atrasaria as validações de hipótese do produto e não há tráfego volumoso o suficiente para justificar custos isolados. Camadas bem isoladas (`/modules`) simulam o benefício do serviço fragmentado sem o custo.

## ADR-002: Utilização de Server-Driven UI (SDUI)
- **Contexto:** Precisávamos decidir se o frontend gerenciaria a conversa ou seria apenas um terminal.
- **Decisão:** Frontend burro, Backend dita regras (Payload conversacional contendo tela, speechText e expectedInput).
- **Justificativa:** Lançamentos nas Lojas (Apple e Play Store) demoram dias. Se o mapeamento de rota mudasse ou a frase falada do robô precisasse ser corrigida para maior empatia com PCDs, o SDUI permite alterar o comportamento imediatamente para todos via Deploy do Backend.

## ADR-003: Bloqueio Rigoroso do ORM (Prisma Client)
- **Contexto:** Serviços começaram a chamar `prisma.user.findFirst` no meio de lógicas de mapa.
- **Decisão:** Proibido injetar dependência de Banco fora de `Repositories`.
- **Justificativa:** Garantir o Princípio de Inversão de Dependência (SOLID - DIP). Facilita os mocks no Jest (Mockamos o Repository e não o banco inteiro). Se no futuro precisarmos trocar do Postgres para um NoSQL de Alta performance (MongoDB), os Casos de Uso continuam intactos.

## ADR-004: FSM (Sessão) Persistida no PostgreSQL
- **Contexto:** A Máquina de Estados da Conversa rodava no `Map` global do Node.js (`memory`).
- **Decisão:** Alterada para usar `Driver: Postgres` e tabela `ConversationSession` em produção.
- **Justificativa:** A escalabilidade Cloud nativa (Deployments em rotaBus) reinicia os containers sem aviso (Spin-down) ou roda réplicas paralelas. Se a conversa rodar localmente no Container 1 e o usuário mandar a resposta que for balanceada para o Container 2, ocorreria erro de Sessão 404. O BD centraliza o estado agnosticamente.

## ADR-005: Voice-First Híbrido, Não Voice-Only
- **Contexto:** Visão radical inicial desejava que a tela fosse 100% limpa, forçando interação via microfone exclusivamente.
- **Decisão:** Implementação híbrida obrigatória (Fallback Visual Permanente).
- **Justificativa:** Entrevistas de produto revelaram que: Idosos no transporte coletivo se recusam a falar com o telefone por constrangimento; ambientes ensurdedores quebram o STT. O app é assistente conversacional, mas todos os fluxos possuem botões físicos na tela correspondentes às respostas.

## ADR-006: Escolha do Expo e React Native
- **Contexto:** Definição de framework mobile.
- **Decisão:** Expo Application Services com file-based routing.
- **Justificativa:** Velocidade de iteração imbatível; Permite OTA (Over the air updates) pulando as burocracias de loja; Maior disponibilidade de pacotes de acessibilidade nativos empacotados (`expo-speech`, `expo-haptics`).

## ADR-007: Tempo Real via Crowdsourcing (Alternativa ao GTFS-R)
- **Contexto:** A prefeitura/concessionária não libera os dados em tempo real dos ônibus (GTFS-Realtime), impossibilitando o rastreamento via API oficial.
- **Decisão:** Rastreamento comunitário (efeito "Waze"), onde o celular do passageiro (no estágio "on_bus") transmite o GPS anônimo via Redis.
- **Justificativa:** Tática criativa e barata para driblar a falta de dados governamentais. Além disso, traz o benefício de economizar chamadas a banco de dados relacionais pesados, usando Redis com TTL (Time-to-Live) de 2 minutos para evitar que ônibus "fantasmas" fiquem presos no mapa.

## ADR-008: Mapas Preview vs Navegação Ativa
- **Contexto:** Usuários acionavam a navegação acidentalmente apenas para ver onde o ponto ficava, ativando o consumo massivo de bateria pelo GPS real-time (`watchPositionAsync`). Além disso, clicavam em "Cheguei ao Ponto" da própria casa.
- **Decisão:** Inserção de um mapa "Preview" estático na tela de Melhor Rota, e Adição de "Distance Validation" com alertas nativos nos botões de transição.
- **Justificativa:** Previne anomalias lógicas (o usuário não consegue avançar etapas se estiver a mais de 150m do alvo) e protege a bateria do usuário final (o rastreio só inicia se ele realmente for viajar).

## ADR-009: Cache de Rotas Escalonável via Redis e Aprimoramento de UX
- **Contexto:** O cache de rotas rodava num `Map` em memória global do Node.js (`route-cache.js`), inviabilizando instâncias múltiplas (load balancer) de compartilharem dados. Na UI, a seleção das múltiplas opções de rotas era rígida e o STT conflituava com o TalkBack/VoiceOver em mudanças de tela.
- **Decisão:** Substituição da memória local por `ioredis` para rotas com TTL (Time-to-Live) de 2 minutos (120s). No frontend, implementação de `useAutoSpeakOnce`, auto-scroll de cards de rotas e nomes inteligentes de rotas ("Mais rápida", "Menos trocas").
- **Justificativa:** Garantir o reaproveitamento de rotas e economia de chamadas da API do Google, não importando para qual container backend o request é roteado. UX aprimorada atende o público alvo primário mitigando a frustração da repetição de fala do robô e centralizando o card focado (auto-scroll) na tela para deficientes visuais limitados.

## ADR-010: Foco Dinâmico (Etapa por Etapa) e Padronização UI (Glassmorphism)
- **Contexto:** A navegação no mapa antes ficava "presa" no primeiro ponto de ônibus (mesmo após o embarque ou na troca de ônibus) e a tela mostrava fundos sólidos obstrusivos. Além disso, as interfaces de erro destoavam do design moderno do app.
- **Decisão:** O mapa agora fica sempre ativo (100% de visibilidade). A câmera do mapa (`Map.tsx`) ajusta seu "bounding box" dinamicamente acompanhando estritamente os trechos do `walkSteps` correspondentes à etapa da jornada (via índice de passo). A interface gráfica globalizou o componente translúcido `LiquidGlassView` para mensagens de erro e componentes flutuantes.
- **Justificativa:** Permite que o usuário seja guiado de forma muito granular, especialmente vital em rotas com múltiplas baldeações e caminhadas entre os ônibus, não se sentindo perdido na imensidão do trajeto inicial. A bússola ativa em 3D também aproxima a imersão na jornada. O design via Glassmorphism ajuda a reter o mapa de fundo sempre visível sem sacrificar a legibilidade dos comandos, aumentando a confiança tátil do usuário.

## ADR-011: Cache Distribuído de APIs Externas no Redis (Geocoding, Places e SDKs)
- **Contexto:** Chamadas repetitivas de Geocoding direto/reverso, busca de lugares e rotas a pé geravam latência desnecessária e consumo de cotas de APIs externas da Google Cloud Platform.
- **Decisão:** Expansão do Redis distribuído para cobrir `geocode:reverse`, `geocode:forward`, `places:search`, rotas agendadas (`route:sched`) e hash de transcrição de voz (`speech:transcribe`).
- **Justificativa:** Coordenadas e bairros não sofrem mutação constante; o cache de 30 dias com arredondamento em 4 casas decimais reduz até 80% do tráfego para a nuvem externa, garantindo respostas sub-50ms para os usuários.

## ADR-012: Enquadramento Óptico em Nível de Rua e Redesign Transit dos Pontos de Caminhada e Embarque
- **Contexto:** O trajeto a pé até o ponto de ônibus aparecia afastado no mapa com a visão da cidade inteira (zoom insuficiente para 55m), e os pontos de caminhada eram esferas azuis de 14px desproporcionais, com um marcador rústico de ponto de ônibus.
- **Decisão:** Implementação de zoom em nível de rua (`latitudeDelta: 0.0015` / zoom ~18.5) para caminhadas curtas (< 400m) com compensação óptica vertical calculada para a janela visível entre os cards. Redesenho dos pontos em trilha de camada dupla (trilha suave de 12px + pontos nítidos de 6px espaçados em `[0, 16]`) e marcador de embarque moderno (cápsula com badge, pin circular de 36px com ícone e agulha de precisão na calçada).
- **Justificativa:** Atende diretamente as diretrizes de acessibilidade visual, permitindo ao pedestre identificar imediatamente a esquina exata em que deve virar e a calçada em que o ônibus para, com alta fidelidade visual (padrão Citymapper / Apple Maps).
