const journeysService = require('./journeys.service');

async function planJourney(req, res, next) {
    try {
        const { origin, destination, departureTime } = req.body;

        const result = await journeysService.planJourney({
            origin,
            destination,
            departureTime,
        });

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    planJourney,
};