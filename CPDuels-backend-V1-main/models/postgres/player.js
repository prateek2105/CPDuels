export default (sequelize, DataTypes) => {
  const Player = sequelize.define('Player', {
    handle: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Guest'
    },
    uid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  });
  
  return Player;
};