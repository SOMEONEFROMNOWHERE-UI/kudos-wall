const mongoose = require('mongoose');

const uri = "mongodb://vijayvisal2710_db_user:9mwsSBR4wyaToPdM@ac-agixqov-shard-00-00.dwkvjbg.mongodb.net:27017,ac-agixqov-shard-00-01.dwkvjbg.mongodb.net:27017,ac-agixqov-shard-00-02.dwkvjbg.mongodb.net:27017/kudoswall?ssl=true&replicaSet=atlas-smhj2a-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("SUCCESS: Connected to MongoDB!");
    process.exit(0);
  } catch (error) {
    console.error("FAILED to connect to MongoDB:");
    console.error(error);
    process.exit(1);
  }
}

testConnection();
