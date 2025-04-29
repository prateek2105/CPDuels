import { Sequelize } from 'sequelize';
import dbConfig from '../../config/db/config.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle
    },
    logging: dbConfig.logging
  }
);

// Import models
import definePlayerModel from './player.js';
import defineDuelModel from './duel.js';
import defineCFProblemModel from './cfproblem.js';
import defineProblemModel from './problem.js';

// Initialize models
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Define models
db.Player = definePlayerModel(sequelize, Sequelize);
db.CFProblem = defineCFProblemModel(sequelize, Sequelize);
db.Problem = defineProblemModel(sequelize, Sequelize);
db.Duel = defineDuelModel(sequelize, Sequelize);

// Define associations
db.Duel.belongsToMany(db.Player, { through: 'DuelPlayers', as: 'players' });
db.Player.belongsToMany(db.Duel, { through: 'DuelPlayers', as: 'duels' });
db.Duel.belongsToMany(db.Problem, { through: 'DuelProblems', as: 'problems' });
db.Problem.belongsToMany(db.Duel, { through: 'DuelProblems', as: 'duels' });

export default db;