import { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export async function verifyToken(req: NextApiRequest): Promise<number | null> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
    };

    return decoded.userId;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
} 