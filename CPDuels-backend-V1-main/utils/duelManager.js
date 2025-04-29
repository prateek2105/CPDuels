import db from "../models/postgres/index.js";
import CodeforcesAPI from "./codeforcesAPI.js";
import TaskManager from "./taskManager.js";
import { Op } from "sequelize";

class DuelManager {

    static async findDuel(id) {
        try {
            const duel = await db.Duel.findByPk(id, {
                include: [
                    { model: db.Player, as: 'players' },
                    { model: db.Problem, as: 'problems' }
                ]
            });
            return duel ? duel.toJSON() : null;
        } catch (err) {
            console.log("Error: invalid findDuel() request... Probably an invalid id.");
            console.error(err);
            return null;
        }
    }

    static async getDuelState(id) {
        try {
            const duel = await db.Duel.findByPk(id);
            return duel ? duel.status : null;
        } catch (err) {
            console.log("Error: invalid getDuelState() request... Probably an invalid id.");
            console.error(err);
            return null;
        }
    }

    static async changeDuelState(id, state) {
        console.log('Duel ' + id + ' State Changed to ' + state);
        try {
            await db.Duel.update(
                { status: state },
                { where: { id: id } }
            );
        } catch (err) {
            console.error("Error changing duel state:", err);
        }
    }

    static async startDuel(id) {
        // First add problems - this needs to happen before changing state
        await this.addProblems(id);
        
        // Then set the start time
        var startTime = new Date().getTime() / 1000;
        try {
            await db.Duel.update(
                { startTime: startTime },
                { where: { id: id } }
            );
        } catch (err) {
            console.error("Error updating start time:", err);
        }

        // Finally change state to ONGOING after everything is set up
        await this.changeDuelState(id, 'ONGOING');
        console.log("ONGOING");
    }

    static async finishDuel(id) {
        await this.changeDuelState(id, 'FINISHED');
        await this.checkProblemSolves(id);
        let winner = await this.findWinner(id);
        
        try {
            await db.Duel.update(
                { result: winner },
                { where: { id: id } }
            );
        } catch (err) {
            console.error("Error updating duel result:", err);
        }
    }

    static async addDuelPlayer(id, handle, uid) {
        try {
            // Get duel
            const duel = await db.Duel.findByPk(id);
            if (!duel) return;
            
            // Check if player exists, create if not
            let player = await db.Player.findOne({ where: { uid: uid } });
            if (!player) {
                player = await db.Player.create({
                    handle: handle,
                    uid: uid
                });
            } else {
                // Update handle if needed
                if (player.handle !== handle) {
                    await player.update({ handle: handle });
                }
            }
            
            // Add association
            await duel.addPlayer(player);
        } catch (err) {
            console.error("Error adding player to duel:", err);
        }
    }

    static async addProblems(id) {
        try {
            const duel = await this.findDuel(id);
            if (!duel || !duel.players || duel.players.length < 2) return;
            
            let handles = [duel.players[0].handle, duel.players[1].handle];
            let cfProblems = await TaskManager.getDuelProblems(
                duel.problemCount, handles, duel.ratingMin, duel.ratingMax
            );
            
            // Get the actual duel object to use Sequelize methods
            const duelObj = await db.Duel.findByPk(id);
            
            /* Points
            Each problem's points is equal to the amount of rating above the rating range minimum, plus 100
            If the rating range delta is 0, each problem is worth 100 points
            */
            for (let i = 0; i < cfProblems.length; i++) {
                // Find original CF problem in database or create it if not found
                let [cfProblem] = await db.CFProblem.findOrCreate({
                    where: { 
                        contestId: cfProblems[i].contestId,
                        index: cfProblems[i].index
                    },
                    defaults: {
                        name: cfProblems[i].name,
                        type: cfProblems[i].type || 'PROGRAMMING',
                        points: cfProblems[i].points,
                        rating: cfProblems[i].rating,
                        tags: cfProblems[i].tags || []
                    }
                });

                // Create duel problem
                let problem = await db.Problem.create({
                    contestId: cfProblems[i].contestId,
                    index: cfProblems[i].index,
                    name: cfProblems[i].name,
                    type: cfProblems[i].type || 'PROGRAMMING',
                    points: (cfProblems[i].rating - duel.ratingMin) + 100,
                    tags: cfProblems[i].tags || [],
                    databaseId: cfProblem.id, // Link to original CF problem
                    playerOneScore: 0,
                    playerTwoScore: 0,
                    playerOneAttempts: 0,
                    playerTwoAttempts: 0
                });
                
                // Associate problem with duel
                await duelObj.addProblem(problem);
            }
            
            console.log("Added problems to duel:", id);
        } catch (err) {
            console.error("Error adding problems to duel:", err);
        }
    }

    static async updateProblemScores(playerNum, solves, id) {
        try {
            const duel = await this.findDuel(id);
            if (!duel) return;
            
            const problems = duel.problems;
            if (playerNum === 0) { // player one
                // Recalculate the number of attempts if problem not solved
                for (let i = 0; i < problems.length; i++) {
                    if (problems[i].playerOneScore === 0) {
                        problems[i].playerOneAttempts = 0; // Reset if not solved
                    }
                }

                for (let i = 0; i < solves.length; i++) {
                    for (let k = 0; k < problems.length; k++) {
                        if (problems[k].playerOneScore > 0) continue; // If player already solved, stop considering
                        if (solves[i].index === problems[k].index && solves[i].contestId === problems[k].contestId) {
                            // Submission for problem match
                            if (solves[i].verdict === 'TESTING') {
                                continue;
                            }
                            if (solves[i].verdict === 'OK') {
                                let penalty = problems[k].playerOneAttempts * 0.1 * problems[k].points;
                                problems[k].playerOneScore = Math.max(0, problems[k].points - penalty);
                            }
                            problems[k].playerOneAttempts++;
                            
                            // Update problem in database
                            await db.Problem.update({
                                playerOneScore: problems[k].playerOneScore,
                                playerOneAttempts: problems[k].playerOneAttempts
                            }, {
                                where: { id: problems[k].id }
                            });
                        }
                    }
                }
            } else { // player two
                // Recalculate the number of attempts if problem not solved
                for (let i = 0; i < problems.length; i++) {
                    if (problems[i].playerTwoScore === 0) {
                        problems[i].playerTwoAttempts = 0; // Reset if not solved
                    }
                }

                for (let i = 0; i < solves.length; i++) {
                    for (let k = 0; k < problems.length; k++) {
                        if (problems[k].playerTwoScore > 0) continue; // If player already solved, stop considering
                        if (solves[i].index === problems[k].index && solves[i].contestId === problems[k].contestId) {
                            // Submission for problem match
                            if (solves[i].verdict === 'TESTING') {
                                continue;
                            }
                            if (solves[i].verdict === 'OK') {
                                let penalty = problems[k].playerTwoAttempts * 0.1 * problems[k].points;
                                problems[k].playerTwoScore = Math.max(0, problems[k].points - penalty);
                            }
                            problems[k].playerTwoAttempts++;
                            
                            // Update problem in database
                            await db.Problem.update({
                                playerTwoScore: problems[k].playerTwoScore,
                                playerTwoAttempts: problems[k].playerTwoAttempts
                            }, {
                                where: { id: problems[k].id }
                            });
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Error updating problem scores:", err);
        }
    }

    static async updateDuelScores(id) {
        try {
            let duel = await this.findDuel(id);
            if (!duel) return;
            
            let playerOneScore = 0; 
            let playerTwoScore = 0;
            let playerOneSolves = 0; 
            let playerTwoSolves = 0;
            
            for (let i = 0; i < duel.problems.length; i++) {
                playerOneScore += duel.problems[i].playerOneScore;
                playerTwoScore += duel.problems[i].playerTwoScore;
                if (duel.problems[i].playerOneScore) playerOneSolves++;
                if (duel.problems[i].playerTwoScore) playerTwoSolves++;
            }
            
            await db.Duel.update({
                playerOneScore: playerOneScore,
                playerTwoScore: playerTwoScore,
                playerOneSolves: playerOneSolves,
                playerTwoSolves: playerTwoSolves
            }, {
                where: { id: id }
            });
        } catch (err) {
            console.error("Error updating duel scores:", err);
        }
    }

    static async checkProblemSolves(id) {
        try {
            let duel = await this.findDuel(id);
            if (!duel || !duel.players || duel.players.length < 2) return;
            
            let playerOneSolves = await TaskManager.getUserSolves(duel, duel.players[0].handle);
            let playerTwoSolves = await TaskManager.getUserSolves(duel, duel.players[1].handle);
            
            if (playerOneSolves) {
                await this.updateProblemScores(0, playerOneSolves, id);
            }
            if (playerTwoSolves) {
                await this.updateProblemScores(1, playerTwoSolves, id);
            }
            await this.updateDuelScores(id);
        } catch (err) {
            console.error("Error checking problem solves:", err);
        }
    }
    
    static async findWinner(id) {
        try {
            let duel = await this.findDuel(id);
            if (!duel) return ["NONE"];
            
            if (duel.playerOneScore > duel.playerTwoScore) {
                return ["WON", duel.players[0].handle];
            } else if (duel.playerTwoScore > duel.playerOneScore) {
                return ["WON", duel.players[1].handle];
            } else {
                return ["TIE"];
            }
        } catch (err) {
            console.error("Error finding winner:", err);
            return ["NONE"];
        }
    }

    static async isValidJoinRequest(id, handle) {
        try {
            let duel = await this.findDuel(id);
            if (!duel) return [false, "Duel not found"];
            
            if (duel.players.length === 2) { // handle multiple players joining at once
                return [false, "Duel Full"];
            }
            let owner = duel.players[0];
            if (owner.handle === handle) {
                return [false, "Duplicate Handles"];
            }
            let validHandle = await CodeforcesAPI.check_handle(handle);
            if (!validHandle[0]) {
                return [false, "Invalid Handle"];
            }
            return [true];
        } catch (err) {
            console.error("Error validating join request:", err);
            return [false, "Server Error"];
        }
    }

    static async isValidDuelRequest(players, problemCount, ratingMin, ratingMax, timeLimit) {
        let validHandle = await CodeforcesAPI.check_handle(players[0].handle);
        if (!validHandle[0]) {
            return [false, "Invalid Handle"];
        }
        let validProblemCount = problemCount && (problemCount >= 1 && problemCount <= 10);
        if (!validProblemCount) {
            return [false, "Invalid Problem Count"];
        }
        let validRatings = (ratingMin && ratingMax) && (ratingMin <= ratingMax) && (ratingMin >= 800 && ratingMax <= 3000);
        if (!validRatings) {
            return [false, "Invalid Ratings"];
        }
        let validTimeLimit = timeLimit && (timeLimit >= 10 && timeLimit <= 180);
        if (!validTimeLimit) {
            return [false, "Invalid Time Limit"];
        }
        return [true];
    }
    
}

export default DuelManager;