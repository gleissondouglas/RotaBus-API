# Fluxos e Engenharia de Voz

A funcionalidade central do projeto é viabilizada pelo gerenciamento da Engenharia de Voz, que orquestra Speech-to-Text (Ouvir) e Text-to-Speech (Falar).

## 1. Text-to-Speech (Assistente Falando)

### Problema Inicial
APIs de TTS padrão do frontend operam de forma assíncrona, mas não informam perfeitamente quando a frase acabou em todos os sistemas operacionais, fazendo com que o microfone ative enquanto a assistente ainda fala, resultando em retroalimentação (a assistente ouve a si mesma).

### Solução (`speakAndWait`)
Foi elaborado um wrapper sobre a API `expo-speech` capaz de transformar os callbacks nativos `onDone` e `onStopped` em uma *Promise* forte.
A execução do aplicativo **pausa** (await) até a fala da frase completa do `speechText` retornado pelo Backend finalizar.

## 2. Speech-to-Text (Aplicativo Ouvindo)

Utiliza-se o plugin `expo-speech-recognition` para garantir a conversão real-time ou batch do que o usuário diz.

### Estados do Microfone
- A UI muda para `LISTENING`.
- Feedback Haptic inicial (vibração) sinaliza PCDs visuais que podem falar.
- Transcrições temporárias são jogadas fora até o evento de encerramento, extraindo a string final.

### Permissões e LGPD
O aplicativo invoca um prompt nativo solicitando acesso ao microfone.
Se negado, o fluxo de voz local é desativado permanentemente na sessão, transitando a UI para modo puramente de Toque/Texto, exibindo teclado virtual para navegação (Graceful Degradation).

## 3. Timeouts, Silêncio e Loops Infinitos

Uma máquina de estados conversacional contínua (Ouvir -> Responder -> Ouvir) pode prender o usuário em caso de falha de conexão ou mudez do ambiente (Silêncio).

**Fluxo Defensivo:**
1. Abertura do Microfone.
2. Contagem de Timeout (ex: 5 segundos sem fala capturada).
3. STT lança evento de timeout/erro.
4. O Frontend não reinicia a fala cegamente. Um contador `retryCount` é acionado.
5. Após esgotar tentativas, a FSM transita para Idle e fecha o microfone, retornando a tela visual.

## 4. Cancelamentos Involuntários

- O hook de cleanup (`useEffect` unmount) invoca `speech.stopSpeaking()` imediatamente, evitando falas rodando em background em telas indevidas.

## 5. Conflito com Leitores de Tela (TalkBack/VoiceOver)

Por ser um aplicativo voltado para PCDs, muitos usuários operam o celular com os leitores nativos ligados (VoiceOver no iOS, TalkBack no Android).
- Quando o `expo-speech` dispara no momento em que a tela monta, ele pode atropelar a voz do próprio leitor nativo do sistema, criando ruído ininteligível ou até repetição infinita.
- **Solução:** O hook customizado `useAutoSpeakOnce` gerencia re-renderizações e controla precisamente a reprodução da fala, garantindo que seja pronunciada apenas uma única vez na montagem da tela, interrompendo graciosamente qualquer loop ao avançar/voltar no sistema.
