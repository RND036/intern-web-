// ES Module version
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};
console.log('Database config:', dbConfig);

// Middleware for JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Routes

// Login
app.post('/api/login', async (req, res) => {
  console.log('Login request received:', req.body); 
  try {
    const { username, password } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
    await connection.end();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if user is an admin
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only admins can log in.' });
    }

    // You might also want to check password here if it’s hashed in DB (e.g., bcrypt.compare)
    // For example: if (!await bcrypt.compare(password, user.password)) { ... }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get all interns 
app.get('/api/users/interns', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'group_leader'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [interns] = await connection.execute(
      'SELECT id, username, email, full_name FROM users WHERE role = "intern"'
    );
    await connection.end();

    res.json(interns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [tasks] = await connection.execute('SELECT * FROM tasks');
    await connection.end();

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create performance score 
app.post('/api/performance-scores', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'group_leader'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { user_id, task_id, week_number, score, feedback } = req.body;

    if (score < 0 || score > 10) {
      return res.status(400).json({ error: 'Score must be between 0 and 10' });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO performance_scores (user_id, task_id, week_number, score, feedback) VALUES (?, ?, ?, ?, ?)',
      [user_id, task_id, week_number, score, feedback]
    );
    await connection.end();

    res.status(201).json({ id: result.insertId, message: 'Score created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get performance scores for a user
app.get('/api/performance-scores/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role === 'intern' && req.user.id != userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [scores] = await connection.execute(
      `
      SELECT ps.*, t.title as task_title, u.full_name 
      FROM performance_scores ps
      JOIN tasks t ON ps.task_id = t.id
      JOIN users u ON ps.user_id = u.id
      WHERE ps.user_id = ?
      ORDER BY ps.week_number DESC, ps.created_at DESC
    `,
      [userId]
    );
    await connection.end();

    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all performance scores (Admin only)
app.get('/api/performance-scores', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'group_leader'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [scores] = await connection.execute(
      `
      SELECT ps.*, t.title as task_title, u.full_name 
      FROM performance_scores ps
      JOIN tasks t ON ps.task_id = t.id
      JOIN users u ON ps.user_id = u.id
      ORDER BY ps.created_at DESC
    `
    );
    await connection.end();

    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
