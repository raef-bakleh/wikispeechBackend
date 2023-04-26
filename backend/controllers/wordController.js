const { Word } = require("../models");

module.exports = {
  async getWordsByGenderAndState(gender, state) {
    const words = await Word.findAll({
      where: { gender, state },
    });
    return words;
  },
};
