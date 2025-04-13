import { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';

export async function verifyToken(req: NextApiRequest): Promise<number | null> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: number;
    };

    return decoded.userId;
  } catch (error) {
    return null;
  }
} 