# Design System e Tokens

O RotaBus exige uma padronização extrema. Como a carga visual precisa ser baixíssima, criamos um Design System simplificado com tokens utilitários centralizados em `frontend/src/theme/`.

## 1. Cores e Identidade (`colors.ts`)

O uso de cores não deve ser estético, mas comunicativo, com uma forte pegada **Apple-style (Imersiva)**:
- **Brand (Primárias):** Azul vibrante, verde sólido, etc.
- **Backgrounds Imersivos (Edge-to-Edge):** Todo o aplicativo abandonou fundos sólidos e "cards" brancos em favor de **LinearGradients expansivos**. Os fundos devem ocupar 100% do display (ignorando SafeAreas na coloração) para criar imersão, mudando a cor do gradiente com base no Light/Dark mode via `useThemeColors`.
- **Inputs Flutuantes:** Elementos de formulário e textos devem flutuar diretamente no fundo gradiente, evitando o uso de caixas ("cards") opacas para separação. Múltiplos fundos geram ruído visual e quebram a estética limpa.
- **Feedback States:**
  - `Success`: Operações de confirmação de rotas, ou aprovações de destino.
  - `Error`: Vermelho para rejeições fortes (Timeout do Mic).
  - `Listening`: Ciano/Azul que indica sensorialidade de Voz, piscando no `VoiceOrb`.

## 2. Tipografia

- Fontes sem-serifa clássicas (Inter, Roboto ou fontes default do sistema). 
- O diferencial não é o tipo de fonte, mas o `fontSize` de leitura nativa escalada. O texto não usa tamanhos miúdos como `12px` de rodapé. Todo o conteúdo é estruturado como Heading H2/H1 e parágrafo grande.

## 3. Layout e Espaçamento (`layout.ts`)

- Espaçamento padrão grande (16px base, 32px entre seções), consumido estritamente de `src/theme/layout.ts` (nunca use magic numbers).
- Touch Targets: Segundo as heurísticas de ergonomia, nenhum botão deve ter altura menor que 48px, preferencialmente 56px de altura cheia na tela. (Wide buttons para evitar erro de touch em usuários com Parkinson).
- Sombras projetadas de modo nítido no `VoiceResponseButton` para gerar percepção de profundidade tátil.

## 4. Iconografia Estilo Apple

- **Pacote Oficial:** Uso estrito do pacote `Ionicons` (via `@expo/vector-icons`).
- **Padrão Outline:** Os ícones devem sempre usar o sufixo `-outline` (ex: `mic-outline`, `location-outline`) para garantir traços finos e minimalistas que se equiparam à linguagem visual do SF Symbols. Ícones preenchidos ("solid" ou do estilo Material/Android) são desencorajados.

## 5. Componentização

- **`VoicePromptText.tsx`:** O balão da Assistente. Grande, centrado, altamente contrastado.
- **`BottomActionBar.tsx`:** Container flutuante que hospeda atalhos que não sujam a visualização principal do conteúdo.
- **`VoiceOrb.tsx`:** Não usa imagens externas, usa renderização vetorial e de `react-native-reanimated` para pulsar os tokens do estado sensorial.

## 6. Elementos de Mapa e Navegação (`Map.tsx`)

- **Trilha Pedestre em Dupla Camada (Pedestrian Halo Track):**
  - **Camada Inferior (Trilha suave):** Linha contínua translúcida (`rgba(37, 99, 235, 0.16)` no modo claro e `rgba(59, 130, 246, 0.25)` no modo escuro) com `strokeWidth: 12`, `lineCap: "round"` e `lineJoin: "round"`. Cria o corredor visual do pedestre sem ruído.
  - **Camada Superior (Pontos nítidos):** Pontos circulares nítidos (`#2563EB`) com `strokeWidth: 6`, `lineDashPattern: [0, 16]` e `lineCap: "round"`. A proporção de 6px encaixa com precisão nas calçadas do mapa, evitando o visual desproporcional de círculos grandes.
- **Marcador de Ponto de Embarque Modern Transit:**
  - **Badge Flutuante:** Cápsula arredondada com sombra suave (`elevation: 4`), ponto indicador azul de 6px e nome legível do ponto (`Ponto de Embarque`).
  - **Pin Circular com Agulha:** Círculo de 36px em azul primário com borda branca de 2.5px e ícone vetorial de ônibus, acompanhado por agulha direcional apontando para a calçada exata.
  - **Sombra de Contato no Solo:** Elipse sutil na base com âncora `{ x: 0.5, y: 1.0 }` para ancoragem perfeita no meio-fio.
- **Marcadores de Virada (Turn Dots):**
  - Círculos brancos de 10px com anel externo primário de 2px e sombra de elevação para destacar decisões de rota.
