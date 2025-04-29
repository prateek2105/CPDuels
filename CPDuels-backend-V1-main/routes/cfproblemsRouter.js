import express from 'express';
import db from '../models/postgres/index.js';

const cfproblemsRouter = express.Router();
const CFProblem = db.CFProblem;

// GET all problems
cfproblemsRouter.get('/', async (req, res) => {
  try {
    const problems = await CFProblem.findAll();
    res.send(problems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET one problem
cfproblemsRouter.get('/:id', getProblem, (req, res) => {
  res.send(res.problem);
});

// POST one problem
cfproblemsRouter.post('/add', async (req, res) => {
  try {
    const newProblem = await CFProblem.create(req.body);
    res.status(201).json(newProblem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH one problem
cfproblemsRouter.patch('/:id', getProblem, async (req, res) => {
  try {
    await res.problem.update(req.body);
    res.json(await res.problem.reload());
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE one problem
cfproblemsRouter.delete('/:id', getProblem, async (req, res) => {
  try {
    await res.problem.destroy();
    res.json({ message: "Problem deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE all problems
cfproblemsRouter.delete('/', async (req, res) => {
  try {
    await CFProblem.destroy({ where: {} });
    res.json({ message: "All problems deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})

async function getProblem(req, res, next) {
  let problem;
  try {
    problem = await CFProblem.findByPk(req.params.id);
    if (problem == null) {
      return res.status(404).json({ message: "Problem not found." });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  
  res.problem = problem;
  next(); 
}

export default cfproblemsRouter;