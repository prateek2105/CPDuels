import CodeforcesAPI from "./codeforcesAPI.js";
import DuelManager from "./duelManager.js";
import db from "../models/postgres/index.js";
import { Op } from "sequelize";

class TaskManager {
    static async updateProblemset() {
        try {
            let problem_list = await CodeforcesAPI.getProblemList();
            console.log(problem_list);
            
            // Use bulkCreate with updateOnDuplicate to handle existing problems
            await db.CFProblem.bulkCreate(problem_list.map(problem => ({
                contestId: problem.contestId,
                index: problem.index,
                name: problem.name,
                type: problem.type || 'PROGRAMMING',
                points: problem.points,
                rating: problem.rating,
                tags: problem.tags || []
            })), {
                updateOnDuplicate: ['name', 'type', 'points', 'rating', 'tags']
            });
        } catch (err) {
            console.error("Error updating problemset:", err);
        }
    }

    static async findCFProblems(filter = {}, fields = {}) {
        try {
            // Convert MongoDB-style filter to Sequelize where clause
            const whereClause = {};
            if (filter.rating) {
                whereClause.rating = {
                    [Op.gte]: filter.rating.$gte,
                    [Op.lte]: filter.rating.$lte
                };
            }
            
            // Convert MongoDB-style fields to Sequelize attributes
            const attributes = Object.keys(fields).length ? Object.keys(fields) : undefined;

            return await db.CFProblem.findAll({
                where: whereClause,
                attributes
            });
        } catch (err) {
            console.error("Error finding CF problems:", err);
            return [];
        }
    }

    static async filterProblemsbyRating(ratingMin, ratingMax) {
        try {
            return await db.CFProblem.findAll({
                where: {
                    rating: {
                        [Op.gte]: ratingMin,
                        [Op.lte]: ratingMax
                    }
                }
            });
        } catch (err) {
            console.error("Error filtering problems by rating:", err);
            return [];
        }
    }

    static async filterProblemsbyHandlesAndRating(handles, ratingMin, ratingMax) {
        try {
            const ratedProblems = await this.filterProblemsbyRating(ratingMin, ratingMax);
            const submissions1 = await CodeforcesAPI.getUserSubmissions(handles[0]);
            const submissions2 = await CodeforcesAPI.getUserSubmissions(handles[1]);
            const combined_submissions = [...submissions1, ...submissions2.filter(item => 
                !submissions1.some(s => s.contestId === item.contestId && s.index === item.index)
            )];

            if (combined_submissions.length === 0) {
                return ratedProblems;
            }

            // Filter out problems that either user has already solved
            return ratedProblems.filter(problem => 
                !combined_submissions.some(sub => 
                    sub.contestId === problem.contestId && sub.index === problem.index
                )
            );
        } catch (err) {
            console.error("Error filtering problems by handles and rating:", err);
            return [];
        }
    }

    static async getDuelProblems(numProblems, handles, ratingMin, ratingMax) {
        try {
            const problems = await this.filterProblemsbyHandlesAndRating(handles, ratingMin, ratingMax);
            // Randomly shuffle the problems array
            const shuffled = [...problems].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, numProblems);
        } catch (err) {
            console.error("Error getting duel problems:", err);
            return [];
        }
    }

    static async getUserSolves(duel, handle) {
        try {
            const filteredSubmissions = await CodeforcesAPI.getUserSubmissionsAfterTime(handle, duel.startTime);
            if (filteredSubmissions && filteredSubmissions.length > 0) {
                console.log(filteredSubmissions);
                return filteredSubmissions.reverse();
            }
            return [];
        } catch (err) {
            console.error("Error getting user solves:", err);
            return [];
        }
    }
}
export default TaskManager;
