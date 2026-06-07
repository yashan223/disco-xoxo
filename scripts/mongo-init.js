// mongo-init.js
// Initialize default database settings if MongoDB container is spun up from scratch.

db = db.getSiblingDB('disco-xoxo');

db.createCollection('users');
db.createCollection('guilds');
db.createCollection('playlists');
db.createCollection('favorites');
db.createCollection('histories');
db.createCollection('logs');
db.createCollection('statistics');

print("✅ Disco XOXO database initialized successfully.");
