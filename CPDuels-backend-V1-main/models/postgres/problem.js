export default (sequelize, DataTypes) => {
  const Problem = sequelize.define('Problem', {
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
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    playerOneAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    playerTwoAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    playerOneScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    playerTwoScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    databaseId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'CFProblems',
        key: 'id'
      }
    }
  });
  
  return Problem;
};