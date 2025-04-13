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

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;
  console.log('Login attempt:', { email, password });

  // Super simple credential check
  if (
    (email === 'miro' && password === 'miro123') ||
    (email === 'shein' && password === 'shein123') ||
    (email === 'aymene' && password === 'aymene123')
  ) {
    // Get the user name based on the email
    const name = email.charAt(0).toUpperCase() + email.slice(1);
    
    return res.status(200).json({
      token: 'dummy-token',
      user: {
        id: email === 'miro' ? 1 : email === 'shein' ? 2 : 3,
        name: name,
        email: email,
        isClockedIn: false
      }
    });
  }

  return res.status(401).json({ message: 'Invalid email or password' });
} 