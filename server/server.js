import express from 'express';
import cors from 'cors';
import studentRoutes from './routes/StudentRoutes.js';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dotenv from 'dotenv';
import './cron-scheduler.js';
import bodyParser from 'body-parser';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Middleware
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/stud', studentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.json('Hello');
});

// Error Handling Middleware
app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
