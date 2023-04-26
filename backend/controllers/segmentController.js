const { Segment } = require("../models");

module.exports = {
  async getSegmentsByStateAndCity(state, city) {
    const segments = await Segment.findAll({
      where: { state, city },
    });
    return segments;
  },
};
