const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Connect DB
connectDB();

// Middleware
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((url) => url.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy blocked origin: ${origin}`), false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/enquiries', require('./routes/enquiry'));
app.use('/api/quotations', require('./routes/quotation'));
app.use('/api/purchase-orders', require('./routes/purchaseOrder'));
app.use('/api/materials', require('./routes/material'));
app.use('/api/production', require('./routes/production'));
app.use('/api/material-requests', require('./routes/materialRequest'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', app: 'Pratiksha ERP' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Pratiksha ERP Server running on port ${PORT}`));
