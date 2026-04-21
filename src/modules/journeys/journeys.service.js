const { validatePlanJourneyInput } = require('./journeys.validator');
const { computeTransitRoute } = require('./providers/googleRoutes.provider');
const { mapGoogleRouteToJourney } = require('./journey.mapper');

async function planJourney({ origin, destination, departureTime }) {
    validatePlanJourneyInput({ origin, destination });

    const googleResponse = await computeTransitRoute({
        origin,
        destination,
        departureTime,
    });

    const mappedJourney = mapGoogleRouteToJourney(googleResponse);

    return mappedJourney;
}

module.exports = {
    planJourney,
};