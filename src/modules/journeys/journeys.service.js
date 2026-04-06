const { validatePlanJourneyInput } = require('./journeys.validator');

async function planJourney({ origin, destination, departureTime }) {
    validatePlanJourneyInput({ origin, destination });

    return {
        summary: {
            leaveHomeAt: departureTime || 'agora',
            beAtStopAt: '18:23',
            arrivalAtDestination: '19:06',
            totalDurationMin: 46,
        },
        message:
            'Saia agora. Caminhe 3 min até o ponto mais próximo. Pegue a linha 31 às 18:23. Faça baldeação para a linha 27. Chegue ao destino às 19:06.',
        steps: [
            {
                type: 'walk',
                instruction: 'Caminhe até o ponto mais próximo',
                durationMin: 3,
                distanceMeters: 200,
            },
            {
                type: 'transit',
                line: '31',
                from: 'Esquina com Rua José Francisco da Silva',
                to: 'Avenida Juca Pato, 252',
                departureTime: '18:23',
                arrivalTime: '18:29',
                stopCount: 7,
            },
            {
                type: 'transit',
                line: '27',
                from: 'Avenida Juca Pato, 252',
                to: 'Parada próxima ao destino',
                departureTime: '18:43',
                arrivalTime: '19:00',
                stopCount: 14,
            },
            {
                type: 'walk',
                instruction: 'Caminhe até o destino final',
                durationMin: 6,
                distanceMeters: 350,
            },
        ],
    };
}

module.exports = {
    planJourney,
};