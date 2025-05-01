import express, { response } from 'express';
import duelsRouter from './routes/duelsRouter.js';
import cfproblemsRouter from './routes/cfproblemsRouter.js';
import DuelManager from './utils/duelManager.js';
import { Server } from 'socket.io';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import allowedOrigins from './config/origins.js';
import TaskManager from './utils/taskManager.js';
import { sleep } from './utils/helpers.js';
import cors from 'cors';
import CodeforcesAPI from './utils/codeforcesAPI.js';
import 'dotenv/config';
import initializeDatabase from './config/db/init.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 
}

app.use(cors(corsOptions))
const PORT = process.env.PORT || 8080;

// Initialize PostgreSQL database
let db;
const initDB = async () => {
  try {
    db = await initializeDatabase();
    console.log("Connected to PostgreSQL database.");
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1); // Exit if database connection fails
  }
};

// Wait for database connection
await initDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/duels', duelsRouter);
app.use('/cfproblems', cfproblemsRouter);

const server = app.listen(PORT, () => console.log(`Server is started on port ${PORT}.`));
const io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

async function getTimeLeft(startTime, maxTime, timeInterval, checkInterval, roomId, io) {
    const curTime = new Date();
    let timeDifference = Math.abs(curTime.getTime() - startTime.getTime());
    if (timeDifference >= maxTime) {
      if (timeInterval) clearInterval(timeInterval);
      if (checkInterval) clearInterval(checkInterval);
      await DuelManager.finishDuel(roomId);
      io.emit('status-change', {roomId: roomId, newStatus: "FINISHED"});
      return "Time's up.";
    }
    return Math.ceil((maxTime - timeDifference)/1000);
}

io.on('connection', async (socket) => {

    socket.on('join', (roomId) => {
        socket.join(roomId);
    });
    socket.on('join-duel', async ({ roomId, handle, uid }) => {
        let duelState = await DuelManager.getDuelState(roomId);
        if (duelState === 'WAITING') {
            console.log(handle + " Wants to Join Duel " + roomId);
            let validJoin = await DuelManager.isValidJoinRequest(roomId, handle);
            if (validJoin[0]) {
                await DuelManager.addDuelPlayer(roomId, handle, uid);
                // Get duel to check player count
                let duel = await DuelManager.findDuel(roomId);
                if (duel.players.length >= 2) {
                    // Start duel immediately when second player joins
                    console.log('Timer Starting - Auto start after second player joined');
                    let timeLimit = duel.timeLimit;
                    const startTime = new Date();
                    const maxTime = timeLimit * 60000; // minutes to milliseconds
                    await DuelManager.startDuel(roomId);

                    console.log('Duel started automatically');
                    io.emit('status-change', {roomId: roomId, newStatus: "ONGOING"});
                    io.emit('problem-change', {roomId: roomId});
                    io.emit('time-left', {roomId: roomId, timeLeft: timeLimit * 60});
                    
                    let timeInterval; let checkInterval;

                    checkInterval = setInterval(async () => {
                        await DuelManager.checkProblemSolves(roomId);
                        let duel = await DuelManager.findDuel(roomId);
                        if (duel.playerOneSolves === duel.problems.length || duel.playerTwoSolves === duel.problems.length) {
                            if (timeInterval) clearInterval(timeInterval);
                            if (checkInterval) clearInterval(checkInterval);
                            await DuelManager.finishDuel(roomId);
                            io.emit('status-change', {roomId: roomId, newStatus: "FINISHED"});
                        }
                    }, 4000);
                    timeInterval = setInterval(async () => {
                        let timeLeft = await getTimeLeft(startTime, maxTime, timeInterval, checkInterval, roomId, io);
                        io.emit('time-left', {roomId: roomId, timeLeft: timeLeft});
                    }, 1000);
                } else {
                    // If only first player joined, set state to READY
                    await DuelManager.changeDuelState(roomId, "READY");
                    io.emit('status-change', {roomId: roomId, newStatus: "READY"});
                }
            } else {
                io.to(socket.id).emit('error-message', validJoin[1]);
            }
        }
    });
    socket.on('start-duel', async ({ roomId }) => {
        console.log('Timer Starting');
        let duelState = await DuelManager.getDuelState(roomId);
        
        console.log("duelState = ");
        console.log(duelState);
        if (duelState === 'READY') {
            console.log('Socket Ready started');
            let duel = await DuelManager.findDuel(roomId);
            let timeLimit = duel.timeLimit;
            const startTime = new Date();
            const maxTime = timeLimit * 60000; // minutes to milliseconds
            await DuelManager.startDuel(roomId);

            console.log('Yo here we go again');
            io.emit('status-change', {roomId: roomId, newStatus: "ONGOING"});
            io.emit('problem-change', {roomId: roomId});
            io.emit('time-left', {roomId: roomId, timeLeft: timeLimit * 60});
            
            let timeInterval; let checkInterval;

            checkInterval = setInterval(async () => {
                await DuelManager.checkProblemSolves(roomId);
                let duel = await DuelManager.findDuel(roomId);
                if (duel.playerOneSolves === duel.problems.length || duel.playerTwoSolves === duel.problems.length) {
                    if (timeInterval) clearInterval(timeInterval);
                    if (checkInterval) clearInterval(checkInterval);
                    await DuelManager.finishDuel(roomId);
                    io.emit('status-change', {roomId: roomId, newStatus: "FINISHED"});
                }
            }, 4000);
            timeInterval = setInterval(async () => {
                let timeLeft = await getTimeLeft(startTime, maxTime, timeInterval, checkInterval, roomId, io);
                io.emit('time-left', {roomId: roomId, timeLeft: timeLeft});
            }, 1000);
        }
    });
});

export default db;