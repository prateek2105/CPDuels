export default (sequelize, DataTypes) => {
  const CFProblem = sequelize.define('CFProblem', {
    contestId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    index: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "PROGRAMMING"
    },
    points: {
      type: DataTypes.INTEGER
    },
    rating: {
      type: DataTypes.INTEGER
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    }
  });
  
  return CFProblem;
};