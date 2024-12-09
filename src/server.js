// Change require statements to import statements
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import admin from 'firebase-admin';
import authRouter from './routes/auth.js';  // Add .js extension
import messagesRouter from './routes/messages.js';  // Add .js extension

dotenv.config();

// Initialize Firebase Admin
let db;
if (!admin.apps.length) {
  try {
    console.log('Initializing Firebase Admin...');
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    console.log('Firebase Admin initialized successfully');
    
    db = admin.firestore();
    
    // Test connection
    try {
      await db.collection('messages').get();
      console.log('Firebase connection test successful');
    } catch (error) {
      console.error('Firebase connection test failed:', error);
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
} else {
  db = admin.firestore();
}