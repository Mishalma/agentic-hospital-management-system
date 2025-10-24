const admin = require('firebase-admin');

// Mock Firestore for demo purposes
class MockFirestore {
  constructor() {
    this.collections = new Map();
  }
  
  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    return new MockCollection(this.collections.get(name));
  }
}

class MockCollection {
  constructor(data) {
    this.data = data;
  }
  
  doc(id) {
    return new MockDocument(this.data, id);
  }
  
  async add(data) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    this.data.set(id, { ...data, id, createdAt: new Date() });
    return { id };
  }
  
  async get() {
    const docs = Array.from(this.data.values()).map(doc => ({
      id: doc.id,
      data: () => doc,
      exists: true
    }));
    return { docs, empty: docs.length === 0 };
  }
  
  where(field, operator, value) {
    const filtered = new Map();
    for (const [id, doc] of this.data) {
      if (this.matchesCondition(doc[field], operator, value)) {
        filtered.set(id, doc);
      }
    }
    return new MockCollection(filtered);
  }
  
  orderBy(field, direction = 'asc') {
    const sorted = new Map([...this.data.entries()].sort((a, b) => {
      const aVal = a[1][field];
      const bVal = b[1][field];
      return direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    }));
    return new MockCollection(sorted);
  }
  
  limit(count) {
    const limited = new Map([...this.data.entries()].slice(0, count));
    return new MockCollection(limited);
  }
  
  matchesCondition(fieldValue, operator, value) {
    switch (operator) {
      case '==': return fieldValue === value;
      case '!=': return fieldValue !== value;
      case '>': return fieldValue > value;
      case '>=': return fieldValue >= value;
      case '<': return fieldValue < value;
      case '<=': return fieldValue <= value;
      case 'in': return value.includes(fieldValue);
      default: return false;
    }
  }
}

class MockDocument {
  constructor(collection, id) {
    this.collection = collection;
    this.id = id;
  }
  
  async get() {
    const data = this.collection.get(this.id);
    return {
      id: this.id,
      exists: !!data,
      data: () => data || null
    };
  }
  
  async set(data) {
    this.collection.set(this.id, { ...data, id: this.id, updatedAt: new Date() });
    return { id: this.id };
  }
  
  async update(data) {
    const existing = this.collection.get(this.id) || {};
    this.collection.set(this.id, { ...existing, ...data, updatedAt: new Date() });
    return { id: this.id };
  }
  
  async delete() {
    this.collection.delete(this.id);
    return { id: this.id };
  }
}

// Mock Firebase config for demo
const mockConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'healthtech-scheduler-demo',
  // In production, use proper service account
};

let db;

// Initialize Firebase Admin (mock for demo)
try {
  if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_PRIVATE_KEY) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.projectId
    });
    
    db = admin.firestore();
  } else {
    // Mock database for demo
    console.log('Using mock database for demo');
    db = new MockFirestore();
  }
} catch (error) {
  console.log('Firebase init failed, using mock database:', error.message);
  db = new MockFirestore();
}

module.exports = { db, admin };