const {
  getMinutesFromDuration,
  formatTimeFromDateTime,
  formatRelativeDateTime,
  buildDateTimeFromTimeText,
  subtractMinutes,
  subtractMinutesFromDateTime,
  calculateTimeDifferenceInMinutes,
  calculateTimeDifferenceFromDateTimes,
} = require("../../shared/utils/date");

const {
  stripHtmlTags,
} = require("./utils/mapper-helpers");

const {
  humanizeWalkingInstruction,
  buildFriendlyMessage,
  buildVoiceBlock,
  buildScreenBlock,
  buildFirstStopGuideBlock,
  buildAlerts,
  buildWalkingOnlyVoiceBlock,
  buildWalkingOnlyScreenBlock,
} = require("./utils/instruction-builder");

const MAX_INITIAL_WALK_MINUTES = 25;

function calculateInitialWalkMinutes(mappedSteps) {
  let total = 0;

  for (const step of mappedSteps) {
    if (step.type === "walk") {
      total += step.durationMin || 0;
      continue;
    }

    if (step.type === "transit") {
      break;
    }
  }

  return total;
}

function calculateInitialWalkDistance(mappedSteps) {
  let total = 0;

  for (const step of mappedSteps) {
    if (step.type === "walk") {
      total += step.distanceMeters || 0;
      continue;
    }

    if (step.type === "transit") {
      break;
    }
  }

  return total;
}

function calculateFinalWalkMinutes(mappedSteps) {
  let total = 0;
  let foundLastTransit = false;

  for (let i = mappedSteps.length - 1; i >= 0; i--) {
    const step = mappedSteps[i];

    if (step.type === "transit") {
      foundLastTransit = true;
      break;
    }

    if (step.type === "walk") {
      total += step.durationMin || 0;
    }
  }

  return foundLastTransit ? total : 0;
}

function calculateTotalWalkMinutes(mappedSteps) {
  return mappedSteps
    .filter((step) => step.type === "walk")
    .reduce((total, step) => total + (step.durationMin || 0), 0);
}

function calculateTransitMinutes(mappedSteps) {
  return mappedSteps
    .filter((step) => step.type === "transit")
    .reduce((total, step) => {
      if (step.departureDateTime && step.arrivalDateTime) {
        return (
          total + calculateTimeDifferenceFromDateTimes(step.departureDateTime, step.arrivalDateTime)
        );
      }

      if (!step.departureTime || !step.arrivalTime) return total;

      return total + calculateTimeDifferenceInMinutes(step.departureTime, step.arrivalTime);
    }, 0);
}

function mapGoogleStepToJourneyStep(step) {
  const startLocation = step.startLocation?.latLng
    ? { lat: step.startLocation.latLng.latitude, lng: step.startLocation.latLng.longitude }
    : null;
  const endLocation = step.endLocation?.latLng
    ? { lat: step.endLocation.latLng.latitude, lng: step.endLocation.latLng.longitude }
    : null;

  if (step.travelMode === "WALK") {
    const rawInstruction = stripHtmlTags(step.navigationInstruction?.instructions) || "Caminhe";
    const maneuver = step.navigationInstruction?.maneuver || null;

    return {
      type: "walk",
      instruction: rawInstruction,
      humanInstruction: humanizeWalkingInstruction(rawInstruction, maneuver),
      maneuver,
      distanceMeters: step.distanceMeters || 0,
      durationMin: getMinutesFromDuration(step.staticDuration),
      polyline: step.polyline?.encodedPolyline || "",
      startLocation,
      endLocation,
    };
  }

  if (step.travelMode === "TRANSIT") {
    const departureDateTime = step.transitDetails?.stopDetails?.departureTime || "";

    const arrivalDateTime = step.transitDetails?.stopDetails?.arrivalTime || "";

    return {
      type: "transit",
      line:
        step.transitDetails?.transitLine?.nameShort ||
        step.transitDetails?.transitLine?.name ||
        "Linha não identificada",
      lineShortName: step.transitDetails?.transitLine?.nameShort || "",
      lineName: step.transitDetails?.transitLine?.name || "",
      from:
        step.transitDetails?.stopDetails?.departureStop?.name ||
        "Ponto de partida não identificado",
      to:
        step.transitDetails?.stopDetails?.arrivalStop?.name || "Ponto de chegada não identificado",
      departureTime:
        step.transitDetails?.localizedValues?.departureTime?.time?.text ||
        formatTimeFromDateTime(departureDateTime),
      arrivalTime:
        step.transitDetails?.localizedValues?.arrivalTime?.time?.text ||
        formatTimeFromDateTime(arrivalDateTime),
      departureDateTime,
      arrivalDateTime,
      stopCount: step.transitDetails?.stopCount || 0,
      headsign: step.transitDetails?.headsign || "",
      polyline: step.polyline?.encodedPolyline || "",
      startLocation,
      endLocation,
      departureLocation: {
        lat: step.transitDetails?.stopDetails?.departureStop?.location?.latLng?.latitude,
        lng: step.transitDetails?.stopDetails?.departureStop?.location?.latLng?.longitude,
      },
      arrivalLocation: {
        lat: step.transitDetails?.stopDetails?.arrivalStop?.location?.latLng?.latitude,
        lng: step.transitDetails?.stopDetails?.arrivalStop?.location?.latLng?.longitude,
      },
      departureStopLocation: {
        latitude: step.transitDetails?.stopDetails?.departureStop?.location?.latLng?.latitude,
        longitude: step.transitDetails?.stopDetails?.departureStop?.location?.latLng?.longitude,
      },
      arrivalStopLocation: {
        latitude: step.transitDetails?.stopDetails?.arrivalStop?.location?.latLng?.latitude,
        longitude: step.transitDetails?.stopDetails?.arrivalStop?.location?.latLng?.longitude,
      },
    };
  }

  return {
    type: "unknown",
    instruction: "Etapa não identificada.",
    startLocation,
    endLocation,
  };
}

function buildMapBlock(mappedSteps, origin) {
  const markers = [];
  const polylines = [];

  // 1. Marker de Origem (Ponto de partida da rota)
  markers.push({
    id: "route-origin",
    type: "origin",
    title: "Ponto de partida",
    lat: origin.lat,
    lng: origin.lng,
  });

  const transitSteps = mappedSteps.filter((s) => s.type === "transit");

  if (transitSteps.length > 0) {
    // 2. Marker de Embarque (Primeiro Ônibus)
    const firstTransit = transitSteps[0];
    if (firstTransit.departureLocation) {
      markers.push({
        id: "boarding-stop",
        type: "boarding_stop",
        title: "Embarque",
        description: firstTransit.from,
        lat: firstTransit.departureLocation.lat,
        lng: firstTransit.departureLocation.lng,
      });
    }

    // 3. Markers de Troca (Se houver mais de um ônibus)
    if (transitSteps.length > 1) {
      for (let i = 0; i < transitSteps.length - 1; i++) {
        const current = transitSteps[i];
        if (current.arrivalLocation) {
          markers.push({
            id: `transfer-${i}`,
            type: "transfer_stop",
            title: "Troca de ônibus",
            description: current.to,
            lat: current.arrivalLocation.lat,
            lng: current.arrivalLocation.lng,
          });
        }
      }
    }

    // 4. Marker de Descida (Último Ônibus)
    const lastTransit = transitSteps[transitSteps.length - 1];
    if (lastTransit.arrivalLocation) {
      markers.push({
        id: "dropoff-stop",
        type: "dropoff_stop",
        title: "Desça aqui",
        description: lastTransit.to,
        lat: lastTransit.arrivalLocation.lat,
        lng: lastTransit.arrivalLocation.lng,
      });
    }
  }

  // 5. Marker de Destino Final (Se o último step tiver endLocation)
  const lastStep = mappedSteps[mappedSteps.length - 1];
  if (lastStep?.endLocation) {
    markers.push({
      id: "destination",
      type: "destination",
      title: "Destino final",
      lat: lastStep.endLocation.lat,
      lng: lastStep.endLocation.lng,
    });
  }

  // 6. Polylines
  mappedSteps.forEach((step, index) => {
    if (step.polyline) {
      polylines.push({
        id: `polyline-${index}`,
        type: step.type === "transit" ? "bus" : "walk",
        encodedPolyline: step.polyline,
        line: step.line,
      });
    }
  });

  return {
    userLocation: origin,
    markers,
    polylines,
  };
}

function buildSummary({ route, mappedSteps, timePreference }) {
  const transitSteps = mappedSteps.filter((step) => step.type === "transit");

  const firstTransitStep = transitSteps[0];
  const lastTransitStep = transitSteps[transitSteps.length - 1];

  const initialWalkTimeMin = calculateInitialWalkMinutes(mappedSteps);
  const initialWalkDistanceMeters = calculateInitialWalkDistance(mappedSteps);
  const finalWalkTimeMin = calculateFinalWalkMinutes(mappedSteps);
  const totalWalkTimeMin = calculateTotalWalkMinutes(mappedSteps);
  const busTimeMin = calculateTransitMinutes(mappedSteps);

  const referenceDateTime = timePreference?.dateTime || new Date().toISOString();

  const firstDepartureDateTime =
    firstTransitStep?.departureDateTime ||
    buildDateTimeFromTimeText(firstTransitStep?.departureTime, referenceDateTime);

  const lastArrivalDateTime =
    lastTransitStep?.arrivalDateTime ||
    buildDateTimeFromTimeText(lastTransitStep?.arrivalTime, referenceDateTime);

  const leaveHomeAt = firstTransitStep?.departureTime
    ? subtractMinutes(firstTransitStep.departureTime, initialWalkTimeMin, referenceDateTime)
    : "";

  const leaveHomeDateTime = firstDepartureDateTime
    ? subtractMinutesFromDateTime(firstDepartureDateTime, initialWalkTimeMin)
    : "";

  const beAtStopDateTime = firstDepartureDateTime || "";

  const arrivalAtDestinationDateTime = lastArrivalDateTime || "";

  const leaveHomeText = formatRelativeDateTime(leaveHomeDateTime);
  const beAtStopText = formatRelativeDateTime(beAtStopDateTime);
  const arrivalAtDestinationText = formatRelativeDateTime(arrivalAtDestinationDateTime);

  const busLines = [
    ...new Set(
      transitSteps
        .map((step) => step.line)
        .filter((line) => line && line !== "Linha não identificada"),
    ),
  ];

  const transfers = transitSteps.length > 0 ? transitSteps.length - 1 : 0;

  return {
    timeType: timePreference?.type || "DEPARTURE",
    requestedTime: formatTimeFromDateTime(timePreference?.dateTime),
    referenceDateTime,

    leaveHomeAt,
    beAtStopAt: firstTransitStep?.departureTime || "",
    arrivalAtDestination: lastTransitStep?.arrivalTime || "",

    leaveHomeDateTime,
    beAtStopDateTime,
    arrivalAtDestinationDateTime,

    leaveHomeText,
    beAtStopText,
    arrivalAtDestinationText,

    totalDurationMin: getMinutesFromDuration(route.duration),
    busLines,
    transfers,
    initialWalkTimeMin,
    initialWalkDistanceMeters,
    finalWalkTimeMin,
    totalWalkTimeMin,
    busTimeMin,
    overviewPolyline: route.polyline?.encodedPolyline || "",
  };
}

function mapSingleRouteToJourney(route, origin, timePreference = null, routeIndex = 0) {
  const steps = route.legs?.[0]?.steps || [];

  if (steps.length === 0) {
    return null;
  }

  const mappedSteps = steps.map(mapGoogleStepToJourneyStep);

  const summary = buildSummary({
    route,
    mappedSteps,
    timePreference,
  });

  const detailedMessage = buildFriendlyMessage(mappedSteps, summary);
  const alerts = buildAlerts(summary.transfers);

  const voice = buildVoiceBlock(mappedSteps, summary, detailedMessage);
  const screen = buildScreenBlock(summary);
  const firstStopGuide = buildFirstStopGuideBlock(mappedSteps, summary);
  const mapData = buildMapBlock(mappedSteps, origin);

  return {
    routeIndex,
    summary,
    voice,
    screen,
    firstStopGuide,
    alerts,
    steps: mappedSteps,
    map: mapData,
  };
}

function sortJourneysByScore(candidates, timePreference = null) {
  const validCandidates = candidates.filter(Boolean);

  if (validCandidates.length === 0) {
    const error = new Error(
      "Não consegui encontrar nenhuma opção de ônibus para este trajeto no momento. Tente mudar o horário de partida ou verificar se os nomes dos lugares estão corretos.",
    );
    error.statusCode = 404;
    throw error;
  }

  const isArrival = timePreference?.type === "ARRIVAL";
  const limit = isArrival ? 30 : MAX_INITIAL_WALK_MINUTES;

  // Filtra candidatos que estão dentro do limite de caminhada
  const accessibleCandidates = validCandidates.filter(
    (candidate) => candidate.summary.initialWalkTimeMin <= limit,
  );

  // Se nenhum for "acessível", usamos todos os válidos para não deixar o usuário sem resposta
  const pool = accessibleCandidates.length > 0 ? accessibleCandidates : validCandidates;

  return [...pool].sort((a, b) => {
    const aHasTransit = a.steps.some((s) => s.type === "transit");
    const bHasTransit = b.steps.some((s) => s.type === "transit");

    // 1. Prioridade absoluta: Se uma rota tem ônibus e a outra não, prefere a que tem ônibus
    if (aHasTransit && !bHasTransit) return -1;
    if (!aHasTransit && bHasTransit) return 1;

    // 2. Score de Conforto (Custo-Benefício) - Menor é melhor
    const getComfortScore = (journey) => {
      let waitTimeMin;
      const targetTimeMs = timePreference?.dateTime ? new Date(timePreference.dateTime).getTime() : Date.now();

      if (isArrival) {
        // Se quer chegar às 08:00 e chega 07:30, "espera" 30 min no destino
        const arrMs = new Date(journey.summary.arrivalAtDestinationDateTime || targetTimeMs).getTime();
        waitTimeMin = Math.max(0, (targetTimeMs - arrMs) / 60000);
      } else {
        // Se quer sair às 08:00 e só sai 08:20, "espera" 20 min no ponto
        const depMs = new Date(journey.summary.leaveHomeDateTime || targetTimeMs).getTime();
        waitTimeMin = Math.max(0, (depMs - targetTimeMs) / 60000);
      }

      const duration = journey.summary.totalDurationMin || 0;
      const walk = journey.summary.totalWalkTimeMin || 0;
      const transfers = journey.summary.transfers || 0;

      // Cálculo:
      // - Duração da viagem (peso 1)
      // - Tempo de espera (peso 1)
      // - Cada minuto caminhando = penalidade dupla (cansaço)
      // - Cada troca de ônibus (baldeação) = penalidade pesada (15 pontos)
      return duration + waitTimeMin + (walk * 2) + (transfers * 15);
    };

    const scoreA = getComfortScore(a);
    const scoreB = getComfortScore(b);
    
    // 3. Desempate final (apenas se o score de conforto empatar perfeitamente)
    if (scoreA === scoreB) {
      return a.summary.initialWalkTimeMin - b.summary.initialWalkTimeMin;
    }

    return scoreA - scoreB;
  });
}

/*
function chooseBestJourney(candidates, timePreference = null) {
  const sorted = sortJourneysByScore(candidates, timePreference);
  return sorted[0];
}
*/

function assignRouteTags(candidates, bestJourney) {
  if (!candidates || candidates.length === 0) return;

  let minDuration = Infinity;
  let minWalk = Infinity;

  candidates.forEach((c) => {
    const dur = c.summary?.totalDurationMin || 0;
    const walk = c.summary?.totalWalkTimeMin || 0;
    if (dur < minDuration) minDuration = dur;
    if (walk < minWalk) minWalk = walk;
  });

  candidates.forEach((c) => {
    if (c.routeIndex === bestJourney.routeIndex) {
      c.summary.tag = "Recomendada";
    } else if (
      c.summary?.totalDurationMin === minDuration &&
      minDuration < (bestJourney.summary?.totalDurationMin || 0)
    ) {
      c.summary.tag = "Mais rápida";
    } else if (
      c.summary?.totalWalkTimeMin === minWalk &&
      minWalk < (bestJourney.summary?.totalWalkTimeMin || 0)
    ) {
      c.summary.tag = "Menos caminhada";
    } else if (c.summary?.transfers === 0 && (bestJourney.summary?.transfers || 0) > 0) {
      c.summary.tag = "Linha direta";
    } else {
      c.summary.tag = `Opção ${c.routeIndex + 1}`;
    }
  });
}

function mapGoogleRouteToJourney(googleResponse, origin, timePreference = null) {
  const routes = googleResponse?.routes || [];

  if (routes.length === 0) {
    const error = new Error(
      "Ops! Não encontrei nenhuma rota de transporte público para este destino. Verifique se o local de destino existe em Uberaba ou tente um horário diferente.",
    );
    error.statusCode = 404;
    throw error;
  }

  const candidates = routes
    .map((route, index) => mapSingleRouteToJourney(route, origin, timePreference, index))
    .filter(Boolean);

  // Ordena todas as rotas pelo score de conforto do servidor e seleciona no máximo as 3 melhores
  const sortedCandidates = sortJourneysByScore(candidates, timePreference);
  const top3Candidates = sortedCandidates.slice(0, 3);

  const bestJourney = top3Candidates[0];
  assignRouteTags(top3Candidates, bestJourney);

  // Filtra as alternativas mantendo apenas as outras (no máximo 2) melhores rotas
  const alternatives = top3Candidates.filter((c) => c.routeIndex !== bestJourney.routeIndex);

  return {
    summary: bestJourney.summary,
    voice: bestJourney.voice,
    screen: bestJourney.screen,
    firstStopGuide: bestJourney.firstStopGuide,
    alerts: bestJourney.alerts,
    steps: bestJourney.steps,
    map: bestJourney.map,
    alternatives: alternatives.map((alt) => ({
      summary: alt.summary,
      voice: alt.voice,
      screen: alt.screen,
      firstStopGuide: alt.firstStopGuide,
      alerts: alt.alerts,
      steps: alt.steps,
      map: alt.map,
      routeIndex: alt.routeIndex,
    })),
    metadata: {
      selectedRouteIndex: bestJourney.routeIndex,
      alternativesFound: top3Candidates.length,
    },
  };
}

function mapWalkingOnlyRouteToJourney(walkingResponse, origin, destination) {
  const route = walkingResponse.routes[0];
  const steps = route.legs[0].steps || [];
  
  const mappedSteps = steps.map(mapGoogleStepToJourneyStep);
  
  const totalDurationMin = getMinutesFromDuration(route.duration);
  const totalDistanceMeters = route.distanceMeters || 0;
  
  const summary = {
    isWalkingOnly: true,
    totalDurationMin,
    totalDistanceMeters,
    totalWalkTimeMin: totalDurationMin,
    initialWalkTimeMin: totalDurationMin,
    initialWalkDistanceMeters: totalDistanceMeters,
    finalWalkTimeMin: 0,
    busTimeMin: 0,
    transfers: 0,
    busLines: [],
    leaveHomeAt: '',
    beAtStopAt: '',
    arrivalAtDestination: '',
    leaveHomeDateTime: '',
    beAtStopDateTime: '',
    arrivalAtDestinationDateTime: '',
    leaveHomeText: '',
    beAtStopText: '',
    arrivalAtDestinationText: '',
    overviewPolyline: route.polyline?.encodedPolyline || '',
  };
  
  const markers = [
    {
      id: "route-origin",
      type: "origin",
      title: "Ponto de partida",
      lat: origin.lat,
      lng: origin.lng,
    },
    {
      id: "destination",
      type: "destination",
      title: "Destino final",
      lat: destination.lat || mappedSteps[mappedSteps.length - 1]?.endLocation?.lat,
      lng: destination.lng || mappedSteps[mappedSteps.length - 1]?.endLocation?.lng,
    }
  ];
  
  const polylines = mappedSteps
    .filter(step => step.polyline)
    .map((step, index) => ({
      id: `polyline-${index}`,
      type: "walk",
      encodedPolyline: step.polyline,
      line: step.line,
    }));
    
  const mapData = {
    userLocation: origin,
    markers,
    polylines,
  };
  
  return {
    summary,
    voice: buildWalkingOnlyVoiceBlock(mappedSteps, summary),
    screen: buildWalkingOnlyScreenBlock(summary),
    firstStopGuide: { available: false },
    alerts: ["Os tempos de caminhada podem variar."],
    steps: mappedSteps,
    map: mapData,
    alternatives: [],
    metadata: { selectedRouteIndex: 0, alternativesFound: 0 },
  };
}

module.exports = {
  mapGoogleRouteToJourney,
  mapWalkingOnlyRouteToJourney,
};
