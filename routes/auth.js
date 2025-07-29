import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

const users = [
  { id: 1, username: 'admin', password: 'password', role: 'admin' },
  { id: 2, username: 'normal', password: 'password', role: 'normal' },
  { id: 3, username: 'limited', password: 'password', role: 'limited' },
];

router.post('/', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const payload = { id: user.id, username: user.username, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
});

export default router;

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Authenticate user and get JWT token
 *     tags: [Auth]
 *     description: >
 *       Use one of the following test users for authentication:
 *       - admin / password (role: admin)
 *       - normal / password (role: normal)
 *       - limited / password (role: limited)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: password
 *     responses:
 *       200:
 *         description: JWT token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Missing username or password
 *       401:
 *         description: Invalid credentials
 */
