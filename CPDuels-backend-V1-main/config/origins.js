import DEBUG from './debug.js';

const allowedOrigins = DEBUG ? ['http://localhost:4000'] : ['https://www.cpduels.com'];

export default allowedOrigins;