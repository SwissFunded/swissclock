import { NextApiRequest, NextApiResponse } from 'next';

const USERS = {
  miro: {
    id: 1,
    name: 'Miro',
    email: 'miro',
    password: 'miro123',
    isClockedIn: false,
  },
  shein: {
    id: 2,
    name: 'Shein',
    email: 'shein',
    password: 'shein123',
    isClockedIn: false,
  },
  aymene: {
    id: 3,
    name: 'Aymene',
    email: 'aymene',
    password: 'aymene123',
    isClockedIn: false,
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password });

    // Find user by email
    const user = USERS[email.toLowerCase()];

    if (user && user.password === password) {
      // Don't send password in response
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({
        token: 'dummy-token',
        user: userWithoutPassword,
      });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 