export default (sequelize, DataTypes) => {
  const Duel = sequelize.define('Duel', {
    ratingMin: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ratingMax: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    problemCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5
    },
    timeLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30
    },
    private: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "WAITING" // READY, ONGOING, FINISHED
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
    playerOneSolves: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    playerTwoSolves: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    result: {
      type: DataTypes.JSONB,
      defaultValue: ['NONE']
    },
    startTime: {
      type: DataTypes.DOUBLE
    },
    platform: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "CF"
    }
  });
  
  return Duel;
};