const { Project } = require("../models");

module.exports = {
  async getProjectsByState(state) {
    const projects = await Project.findAll({
      where: { state },
    });
    return projects;
  },
};
