module.exports = (sequelize, DataTypes) => {
  const Speaker = sequelize.define(
    "Speaker",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      age: DataTypes.INTEGER,
      sex: DataTypes.STRING,
      code: DataTypes.STRING,
      comment: DataTypes.STRING,
      weight: DataTypes.INTEGER,
      height: DataTypes.INTEGER,
      accent: DataTypes.TEXT,
    },
    { tableName: "speaker", timestamps: false }
  );

  return Speaker;
};
