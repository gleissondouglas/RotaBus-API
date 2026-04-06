function validatePlanJourneyInput({ origin, destination }) {
    if (!origin || !destination) {
        const error = new Error('Origem e destino são obrigatórios.');
        error.statusCode = 400;
        throw error;
    }

    if (typeof origin.lat !== 'number' || typeof origin.lng !== 'number') {
        const error = new Error('Latitude e longitude da origem devem ser números.');
        error.statusCode = 400;
        throw error;
    }

    if (!destination.text || typeof destination.text !== 'string') {
        const error = new Error('O destino deve conter um texto válido.');
        error.statusCode = 400;
        throw error;
    }
}

module.exports = {
    validatePlanJourneyInput,
};