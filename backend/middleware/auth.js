import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import prisma from '../config/database.js';

// Middleware to protect routes
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token, return error
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized access. No token provided.' });
    }

    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { manager: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized access. User not found.' });
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    console.error('JWT Error:', error);
    return res.status(401).json({ error: 'Unauthorized access. Invalid token.' });
  }
};

// Middleware to authorize roles
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.' 
      });
    }
    next();
  };
};

// Helper to check if user has management/executive privileges
export const isManagementRole = (role) => {
  return ['ADMIN', 'MANAGER', 'CEO', 'CFO', 'CTO', 'DIRECTOR'].includes(role);
};