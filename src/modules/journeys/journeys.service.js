const { validatePlanJourneyInput } = require('./journeys.validator');
const { computeTransitRoute } = require('./providers/googleRoutes.provider');

async function planJourney({ origin, destination, departureTime }) {
    validatePlanJourneyInput({ origin, destination });

    const googleResponse = await computeTransitRoute({
        origin,
        destination,
        departureTime,
    });

    return googleResponse;
}

module.exports = {
    planJourney,
};