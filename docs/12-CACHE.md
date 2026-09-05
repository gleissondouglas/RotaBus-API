# Estratégia de Cache e Performance

Para mitigar a latência e reduzir drasticamente os custos com a camada externa (Google Cloud Platform), o projeto implementa uma arquitetura robusta de cache distribuído com **Redis (`ioredis`)** no backend e cache local no dispositivo no frontend.

---

## 1. Arquitetura de Cache no Backend (Redis)

O backend utiliza o Redis para armazenar respostas de APIs externas e dados com diferentes características de volatilidade:

| Recurso | Chave no Redis | TTL (Tempo de Vida) | Objetivo |
| :--- | :--- | :--- | :--- |
| **Rotas de Ônibus (Ao Vivo)** | `route:live:{origLat,origLng}:{destino}:{pref}` | Dinâmico (até `leaveHomeDateTime` + 60s) | Reaproveita rotas calculadas se o usuário buscar novamente dentro do intervalo em que ainda é viável sair de casa |
| **Rotas de Ônibus (Agendadas)** | `route:sched:{origLat,origLng}:{destino}:{pref}:{data_arredondada}` | Até a data da viagem | Evita reconsultas para trajetos planejados para o futuro |
| **Rotas a Pé Puras** | `route:walk:{origLat,origLng}:{destLat,destLng}` | 7 dias | O caminho a pé entre dois pontos físicos é estático e independe de trânsito |
| **Busca de Lugares (Places)** | `places:{query_normalizada}` | 30 dias | "Centro", "Hospital de Clínicas", etc. têm coordenadas fixas |
| **Geocodificação Reversa** | `geocode:reverse:{lat4,lng4}` | 30 dias | Converte GPS em nome de rua/bairro (~11m de precisão) |
| **Geocodificação Direta** | `geocode:forward:{endereco_normalizado}` | 30 dias | Converte texto de rua digitado em coordenadas |
| **Transcrição de Áudio (STT)** | `speech:transcribe:{hash_sha256}` | 24 horas | Evita reprocessar pacotes idênticos de áudio em retries de rede |
| **Crowdsourcing (Ônibus ao vivo)** | `bus:line:{linha}:{sentido}` | 120 segundos | Localização em tempo real informada pela comunidade |

---

## 2. Princípio de Funcionamento por Módulo

### 2.1 Route Cache Inteligente (`route-cache.js`)
1. **Normalização de Coordenadas:** Origem e destino têm coordenadas arredondadas a 3 casas decimais (~100 metros), permitindo agrupar passageiros na mesma quadra/ponto.
2. **Janela de Saída Viável:** Ao consultar o cache, o backend verifica se o horário para sair de casa (`leaveHomeDateTime`) já passou há mais de 60 segundos. Se ainda for viável, a rota é entregue instantaneamente e os minutos restantes são recalculados em tempo real sem chamar a Google Routes API.
3. **Resiliência:** Se o Redis apresentar instabilidade, o sistema cai suavemente para a chamada direta da API externa sem interromper o serviço.

### 2.2 Geocoding Cache (`geocoding.provider.js`)
- Ruas e bairros não mudam de posição geográfica.
- O arredondamento a 4 casas decimais garante que pequenas imprecisões de sinal GPS reutilizem o mesmo endereço já resolvido.

### 2.3 Rotas a Pé (`googleRoutes.provider.js`)
- Quando a distância é inferior a 1 km ou quando não há ônibus disponível, o sistema busca rotas a pé com cache de 7 dias, reduzindo drasticamente o consumo de cotas.

### 2.4 Transcrição com Hash SHA-256 (`googleSpeech.provider.js`)
- Gera um hash SHA-256 a partir dos bytes em base64 do áudio recebido. Se o aplicativo reenviar o pacote em caso de instabilidade móvel, a resposta transcrita é devolvida instantaneamente sem novo custo no Google Speech.

---

## 3. Cache do Dispositivo (Frontend Storage e Offline-First)

O Frontend (React Native / Expo) possui sua própria camada de persistência:
- **Offline-First (`utils/cache.ts`):** Grava respostas de rotas e destinos recentes no disco local via `SecureStore` / `AsyncStorage`.
- **Favoritos e Histórico:** Armazenados localmente para acesso imediato na tela inicial.
- **Logs de Desenvolvimento:** `devLogger.ts` intercepta interações apenas quando `__DEV__` for verdadeiro, mantendo zero overhead no ambiente de produção.
- **Lembretes Locais (`routeReminder.service.ts`):** Agenda notificações no sistema operacional (`expo-notifications`) para disparar 10 minutos antes da hora de sair de casa para viagens planejadas com mais de 30 minutos de antecedência.
