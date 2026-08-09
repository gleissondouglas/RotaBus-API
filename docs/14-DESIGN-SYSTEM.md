# Design System e Tokens

O Nuvem exige uma padronização extrema. Como a carga visual precisa ser baixíssima, criamos um Design System simplificado com tokens utilitários centralizados em `frontend/src/theme/`.

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
