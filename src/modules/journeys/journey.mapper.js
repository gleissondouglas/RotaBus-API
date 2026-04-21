function getSecondsFromDuration(durationText) {
    if (!durationText) return 0;

    return parseInt(durationText.replace('s', ''), 10) || 0;
}

function getMinutesFromDuration(durationText) {
    const seconds = getSecondsFromDuration(durationText);
    return Math.ceil(seconds / 60);
}

function getShortStopName(stopName) {
    if (!stopName) return 'ponto não identificado';

    return stopName.split(',')[0].trim();
}

function calculateInitialWalkMinutes(mappedSteps) {
    let total = 0;

    for (const step of mappedSteps) {
        if (step.type === 'walk') {
            total += step.durationMin || 0;
            continue;
        }

        if (step.type === 'transit') {
            break;
        }
    }

    return total;
}

function subtractMinutes(timeText, minutesToSubtract) {
    if (!timeText) return '';

    const [hours, minutes] = timeText.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes - minutesToSubtract;

    const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
    const newHours = Math.floor(normalizedMinutes / 60);
    const newMinutes = normalizedMinutes % 60;

    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

function buildFriendlyMessage(mappedSteps) {
    const transitSteps = mappedSteps.filter((step) => step.type === 'transit');
    const initialWalkMinutes = calculateInitialWalkMinutes(mappedSteps);

    if (transitSteps.length === 0) {
        return 'Rota encontrada. Vá caminhando até o destino.';
    }

    const firstTransit = transitSteps[0];
    const lastTransit = transitSteps[transitSteps.length - 1];
    const secondTransit = transitSteps[1];

    const leaveHomeAt = subtractMinutes(firstTransit.departureTime, initialWalkMinutes);
    const firstStop = getShortStopName(firstTransit.from);
    const transferStop = getShortStopName(firstTransit.to);
    const finalStop = getShortStopName(lastTransit.to);

    if (transitSteps.length === 1) {
        return `Saia de casa às ${leaveHomeAt} e vá até o ponto da ${firstStop}. Às ${firstTransit.departureTime}, pegue o ônibus ${firstTransit.line}, sentido ${firstTransit.headsign}. Desça no ponto da ${finalStop} às ${firstTransit.arrivalTime} e caminhe até o destino.`;
    }

    return `Saia de casa às ${leaveHomeAt} e vá até o ponto da ${firstStop}. Às ${firstTransit.departureTime}, pegue o ônibus ${firstTransit.line}, sentido ${firstTransit.headsign}. Desça no ponto da ${transferStop} às ${firstTransit.arrivalTime}. Depois, às ${secondTransit.departureTime}, pegue o ônibus ${secondTransit.line}, sentido ${secondTransit.headsign}. Desça no ponto da ${finalStop} às ${lastTransit.arrivalTime} e caminhe até o destino.`;
}

function mapGoogleRouteToJourney(googleResponse) {
    const route = googleResponse?.routes?.[0];

    if (!route) {
        const error = new Error('Nenhuma rota encontrada.');
        error.statusCode = 404;
        throw error;
    }

    const steps = route.legs?.[0]?.steps || [];

    const mappedSteps = steps.map((step) => {
        if (step.travelMode === 'WALK') {
            return {
                type: 'walk',
                instruction:
                    step.navigationInstruction?.instructions || 'Vá andando até o próximo ponto',
                distanceMeters: step.distanceMeters || 0,
                durationMin: getMinutesFromDuration(step.staticDuration),
            };
        }

        if (step.travelMode === 'TRANSIT') {
            return {
                type: 'transit',
                line:
                    step.transitDetails?.transitLine?.nameShort ||
                    step.transitDetails?.transitLine?.name ||
                    'Linha não identificada',
                from:
                    step.transitDetails?.stopDetails?.departureStop?.name ||
                    'Ponto de partida não identificado',
                to:
                    step.transitDetails?.stopDetails?.arrivalStop?.name ||
                    'Ponto de chegada não identificado',
                departureTime:
                    step.transitDetails?.localizedValues?.departureTime?.time?.text || '',
                arrivalTime:
                    step.transitDetails?.localizedValues?.arrivalTime?.time?.text || '',
                stopCount: step.transitDetails?.stopCount || 0,
                headsign: step.transitDetails?.headsign || '',
            };
        }

        return {
            type: 'unknown',
            instruction: 'Etapa não identificada',
        };
    });

    const firstTransitStep = mappedSteps.find((step) => step.type === 'transit');
    const lastTransitStep = [...mappedSteps].reverse().find((step) => step.type === 'transit');

    const initialWalkMinutes = calculateInitialWalkMinutes(mappedSteps);

    const summary = {
        leaveHomeAt: firstTransitStep?.departureTime
            ? subtractMinutes(firstTransitStep.departureTime, initialWalkMinutes)
            : '',
        beAtStopAt: firstTransitStep?.departureTime || '',
        arrivalAtDestination: lastTransitStep?.arrivalTime || '',
        totalDurationMin: getMinutesFromDuration(route.duration),
    };

    const message = buildFriendlyMessage(mappedSteps);

    return {
        summary,
        message,
        steps: mappedSteps,
    };
}

module.exports = {
    mapGoogleRouteToJourney,
};