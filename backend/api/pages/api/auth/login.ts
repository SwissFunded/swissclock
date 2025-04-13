import { NextApiRequest, NextApiResponse } from 'next';

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

    // Simple check for the hardcoded credentials
    if (email === 'shein' && password === 'shein123') {
      return res.status(200).json({
        token: 'dummy-token',
        user: {
          id: 1,
          name: 'Shein',
          email: 'shein',
          isClockedIn: false,
        },
      });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 