# Diretrizes de UI do Aplicativo (Rotabus)

Ao criar ou modificar telas para o aplicativo frontend, aplique SEMPRE o seguinte padrão visual "estilo Apple":

1. **Fundo Gradiente Edge-to-Edge:**
   - O gradiente de fundo (`LinearGradient`) deve ocupar 100% da tela física, ignorando a `SafeAreaView`.
   - Para isso, coloque o `LinearGradient` absoluto dentro de uma `<View style={{ flex: 1 }}>` raiz da tela, e envolva o `ScreenContainer` por cima com fundo transparente.
   - Exemplo de estrutura padrão:
     ```tsx
     <View style={{ flex: 1 }}>
       <LinearGradient colors={['#E0F2FE', '#F0F9FF', theme.background]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFillObject} />
       <ScreenContainer backgroundColor="transparent" withPadding={false}>
         {/* conteúdo da tela... */}
       </ScreenContainer>
     </View>
     ```

2. **Formulários e Inputs Flutuantes:**
   - Não coloque os formulários, `TextField` ou botões dentro de contêineres tipo "card" (caixas com cor de fundo branca, bordas ou sombras).
   - O conteúdo deve flutuar de forma fluida e direta sobre o fundo gradiente da tela, criando uma interface imersiva.

3. **Iconografia Consistente:**
   - Utilize SEMPRE o pacote `Ionicons` (do `@expo/vector-icons`).
   - Prefira de forma estrita os ícones com o sufixo `-outline` para manter o visual moderno com traços finos (similar ao SF Symbols da Apple). Ex: `mic-outline`, `create-outline`, `location-outline`.
