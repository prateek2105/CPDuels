import db from '../../models/postgres/index.js';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import dbConfig from './config.js';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to run the SQL initialization script
async function runSQLScript() {
  try {
    const sqlFilePath = join(__dirname, 'init.sql');
    console.log(`Running SQL script: ${sqlFilePath}`);
    
    // Create database if not exists (can't be done inside the script because we're not connected yet)
    await execPromise(`PGPASSWORD=${dbConfig.password} psql -U ${dbConfig.username} -h ${dbConfig.host} -p ${dbConfig.port} -c "CREATE DATABASE IF NOT EXISTS ${dbConfig.database};"`)
      .catch(() => {
        console.log('Database might already exist or using a different syntax, trying alternative command');
        return execPromise(`PGPASSWORD=${dbConfig.password} psql -U ${dbConfig.username} -h ${dbConfig.host} -p ${dbConfig.port} -c "CREATE DATABASE ${dbConfig.database};"`)
          .catch(() => console.log('Database likely already exists, continuing with initialization'));
      });
    
    // Run the SQL script
    await execPromise(`PGPASSWORD=${dbConfig.password} psql -U ${dbConfig.username} -h ${dbConfig.host} -p ${dbConfig.port} -d ${dbConfig.database} -f ${sqlFilePath}`)
      .catch(error => {
        console.error('Error executing SQL script:', error);
      });
    
    console.log('SQL script execution completed');
  } catch (error) {
    console.error('Error running SQL script:', error);
  }
}

// Initialize database
async function initializeDatabase() {
  try {
    // Run SQL script to create tables
    await runSQLScript();
    
    // Sync Sequelize models with database
    await db.sequelize.sync({ alter: true });
    console.log('Database synchronized');
    
    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

export default initializeDatabase;