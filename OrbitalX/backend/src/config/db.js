const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');
const os = require('os');
const dns = require('dns');

// Configure reliable DNS servers to resolve MongoDB Atlas SRV records on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // Use system default if setServers is unavailable
}

let mongoServerInstance = null;

// Clean up stale mongo-mem-* temp folders to prevent disk exhaustion
const cleanupStaleTempMongoDirs = () => {
  try {
    const tempDir = os.tmpdir();
    const entries = fs.readdirSync(tempDir);
    for (const entry of entries) {
      if (entry.startsWith('mongo-mem-')) {
        const fullPath = path.join(tempDir, entry);
        try {
          fs.rmSync(fullPath, { recursive: true, force: true, maxRetries: 2 });
        } catch (_) {
          // ignore locked files
        }
      }
    }
  } catch (err) {
    // Non-fatal cleanup error
  }
};

const connectDB = async () => {
  cleanupStaleTempMongoDirs();

  // Fail fast if disconnected rather than buffering forever
  mongoose.set('bufferCommands', false);

  try {
    const isAtlas = (process.env.MONGODB_URI || '').includes('mongodb+srv://') || (process.env.MONGODB_URI || '').includes('mongodb.net');
    console.log(`[Database] Attempting connection to ${isAtlas ? 'MongoDB Atlas Cluster' : process.env.MONGODB_URI}...`);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, { 
      serverSelectionTimeoutMS: isAtlas ? 15000 : 5000 
    });
    console.log(`[Database] SUCCESS: Connected to ${isAtlas ? 'MongoDB Atlas' : 'MongoDB'}: ${conn.connection.host} (DB: ${conn.connection.name})`);
  } catch (error) {
    console.warn(`[Database] Failed to connect to ${process.env.MONGODB_URI}: ${error.message}`);
    console.warn('[Database] Falling back to In-Memory MongoDB Server...');
    
    try {
      mongoServerInstance = await MongoMemoryServer.create();
      const mongoUri = mongoServerInstance.getUri();
      
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`[Database] In-Memory MongoDB Connected: ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`[Database] In-Memory Fallback Error: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

// Graceful cleanup on shutdown
const shutdownMongo = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServerInstance) {
      await mongoServerInstance.stop();
    }
    cleanupStaleTempMongoDirs();
  } catch (_) {}
};

process.on('SIGINT', async () => {
  await shutdownMongo();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await shutdownMongo();
  process.exit(0);
});

module.exports = connectDB;

