# Integrações (Google APIs)

O coração geoespacial do RotaBus depende das APIs da Google Cloud Platform (GCP). Como essas integrações são vitais e envolvem cobrança em dólar, o mapeamento, otimização de cotas e blindagem dessas APIs com cache no Redis é prioridade máxima.

---

## 1. Provider de Rotas (`googleRoutes.provider.js`)

**API Utilizada:** Google Routes API (`/directions/v2:computeRoutes`).
- **Rotas de Ônibus (`computeTransitRoute`):** Computa trajetos de transporte público com alternativas. Integrado ao `route-cache.js` no Redis, com chave normalizada e janela de saída (`leaveHomeDateTime`). Se o usuário pesquisar novamente antes do ônibus partir, o resultado vem do Redis sem gastar cota.
- **Rotas a Pé Puras (`computeWalkingRoute`):** Quando a distância é curta (< 1 km) ou não há ônibus, calcula o trajeto a pé com cache de **7 dias** no Redis (`route:walk:{origem}:{destino}`).
- **Restrição de Máscara (`FieldMask`):** Enviamos apenas os campos necessários (`routes.duration`, `routes.distanceMeters`, `routes.polyline`, `routes.legs.steps...`), evitando cobrança de SKUs adicionais.

---

## 2. Provider de Locais (`googlePlaces.provider.js`)

**API Utilizada:** Google Places API (New Text Search `/v1/places:searchText`).
- **Objetivo:** Resolver termos de busca digitados ou falados pelo usuário que não sejam apelidos estáticos locais.
- **Cache no Redis:** Chave `places:{query}` com TTL de **30 dias**. Cidades e pontos de interesse como "Centro", "Terminal Manoel Mendes" e "Shopping Uberaba" são cacheados para todos os usuários.
- **Location Bias:** Usa um raio de 15km centralizado no GPS do usuário ou no centro de Uberaba para priorizar estabelecimentos da cidade.

---

## 3. Geocoding (`geocoding.provider.js`)

**API Utilizada:** Google Geocoding API (`/maps/api/geocode/json`).
- **Geocodificação Reversa (`getAddressFromCoordinates`):** Converte GPS `(lat, lng)` no endereço formatado da rua/bairro. Cache no Redis com chave `geocode:reverse:{lat4,lng4}` e TTL de **30 dias**.
- **Geocodificação Direta (`geocodeAddress`):** Converte texto de endereço em coordenadas. Cache no Redis com chave `geocode:forward:{endereco}` e TTL de **30 dias**.

---

## 4. Speech-to-Text (`googleSpeech.provider.js`)

**API Utilizada:** Google Cloud Speech-to-Text (`/v1p1beta1/speech:recognize`).
- **Objetivo:** Transcrever áudio base64 capturado pelo microfone do usuário para texto.
- **Cache no Redis:** Gera hash criptográfico **SHA-256** do pacote de áudio (`speech:transcribe:{hash}`). Salva transcrições por **24 horas**, evitando custos duplicados em reenvios de pacotes por oscilação de sinal 4G/5G.

---

## 5. Blindagens de Custo

1. **Daily Journey Limit (PostgreSQL):** Limita a quantidade diária de buscas de rota por usuário cadastrado via `dailyLimitMiddleware`.
2. **Cluster de Cache Distribuído (Redis):** Intercepta buscas repetidas de rotas, geocoding, places e voz antes de qualquer chamada HTTP externa.
3. **Field Masking Estrito:** Impede o retorno de campos desnecessários que encarecem a requisição na Google Cloud.
