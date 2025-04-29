import express from 'express';
import db from '../models/postgres/index.js';
import DuelManager from '../utils/duelManager.js';

const duelsRouter = express.Router();
const Duel = db.Duel;

// GET all duels
duelsRouter.get('/', async (req, res) => {
  try {
    const duels = await Duel.findAll({
      include: [
        { model: db.Player, as: 'players' },
        { model: db.Problem, as: 'problems' }
      ]
    });
    res.send(duels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET one duel
duelsRouter.get('/:id', getDuel, (req, res) => {
  res.send(res.duel);
});

// POST one duel
duelsRouter.post('/add', async (req, res) => {
  try {
    console.log(req.body);
    let validDuel = await DuelManager.isValidDuelRequest(
      req.body.players, 
      req.body.problemCount, 
      req.body.ratingMin, 
      req.body.ratingMax, 
      req.body.timeLimit
    );
    
    console.log(validDuel);
    
    if (validDuel[0]) {
      // Create the duel
      const duel = await Duel.create({
        ratingMin: req.body.ratingMin,
        ratingMax: req.body.ratingMax,
        problemCount: req.body.problemCount,
        timeLimit: req.body.timeLimit,
        private: req.body.private || false,
        platform: req.body.platform || 'CF'
      });
      
      // Add the first player
      if (req.body.players && req.body.players.length > 0) {
        const player = req.body.players[0];
        const [playerRecord] = await db.Player.findOrCreate({
          where: { uid: player.uid },
          defaults: { handle: player.handle }
        });
        
        await duel.addPlayer(playerRecord);
      }
      
      // Get complete duel with associations
      const newDuel = await Duel.findByPk(duel.id, {
        include: [
          { model: db.Player, as: 'players' },
          { model: db.Problem, as: 'problems' }
        ]
      });
      
      res.status(201).json(newDuel);
    } else {
      res.status(400).json({ message: validDuel[1] });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH one duel
duelsRouter.patch('/:id', getDuel, async (req, res) => {
  if (req.body.status != null) {
    try {
      await res.duel.update({ status: req.body.status });
      const updatedDuel = await res.duel.reload({
        include: [
          { model: db.Player, as: 'players' },
          { model: db.Problem, as: 'problems' }
        ]
      });
      res.json(updatedDuel);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  } else {
    res.status(400).json({ message: "No valid fields to update" });
  }
});

// DELETE one duel
duelsRouter.delete('/:id', getDuel, async (req, res) => {
  try {
    await res.duel.destroy();
    res.json({ message: "Duel deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE all duels
duelsRouter.delete('/', async (req, res) => {
  try {
    await Duel.destroy({ where: {} });
    res.json({ message: "All duels deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getDuel(req, res, next) {
  let duel;
  try {
    duel = await Duel.findByPk(req.params.id, {
      include: [
        { model: db.Player, as: 'players' },
        { model: db.Problem, as: 'problems' }
      ]
    });
    
    if (duel == null) {
      return res.status(404).json({ message: "Duel not found." });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  
  res.duel = duel;
  next(); 
}

export default duelsRouter;