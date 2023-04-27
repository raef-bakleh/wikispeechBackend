const { Speaker } = require("../models");

module.exports = {
  async getSpeakersByStateAndCity(state, city) {
    const speakers = await Speaker.findAll({
      where: { state, city },
    });
    const count = await Speaker.count({
      where: { state, city },
    });
    return { speakers, count };
  },
};
