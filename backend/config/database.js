const mongoose = require('mongoose');

class Database {
    constructor() {
        this.connection = null;
    }

    async connect() {
        try {
            const mongoUri = process.env.MONGODB_URI;
            
            if (!mongoUri) {
                console.log('⚠️  MongoDB URI not configured, running in demo mode');
                return null;
            }

            // MongoDB connection options
            const options = {
                maxPoolSize: 10, // Maintain up to 10 socket connections
                serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
                socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            };

            this.connection = await mongoose.connect(mongoUri, options);

            console.log('🗄️  MongoDB Atlas connected successfully!');
            console.log(`📊 Database: ${this.connection.connection.name}`);
            console.log(`🌐 Host: ${this.connection.connection.host}`);

            // Handle connection events
            mongoose.connection.on('error', (error) => {
                console.error('❌ MongoDB connection error:', error);
            });

            mongoose.connection.on('disconnected', () => {
                console.log('⚠️  MongoDB disconnected');
            });

            mongoose.connection.on('reconnected', () => {
                console.log('🔄 MongoDB reconnected');
            });

            // Graceful shutdown
            process.on('SIGINT', async () => {
                await this.disconnect();
                process.exit(0);
            });

            return this.connection;

        } catch (error) {
            console.error('❌ MongoDB connection failed:', error.message);
            console.log('🔄 Continuing in demo mode without database...');
            return null;
        }
    }

    async disconnect() {
        try {
            if (this.connection) {
                await mongoose.connection.close();
                console.log('🔌 MongoDB connection closed');
            }
        } catch (error) {
            console.error('❌ Error closing MongoDB connection:', error);
        }
    }

    getConnection() {
        return this.connection;
    }

    isConnected() {
        return mongoose.connection.readyState === 1;
    }
}

module.exports = new Database();