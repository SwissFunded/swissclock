import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../utils/auth';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const userId = await verifyToken(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    switch (req.method) {
      case 'GET':
        const timeEntries = await prisma.timeEntry.findMany({
          where: { userId },
          orderBy: { startTime: 'desc' },
          include: { user: true },
        });
        return res.status(200).json(timeEntries);

      case 'POST':
        const { startTime } = req.body;
        
        // Check if user is already clocked in
        const activeEntry = await prisma.timeEntry.findFirst({
          where: {
            userId,
            endTime: null,
          },
        });

        if (activeEntry) {
          return res.status(400).json({ message: 'Already clocked in' });
        }

        // Create new time entry and update user status
        const [newEntry] = await prisma.$transaction([
          prisma.timeEntry.create({
            data: {
              userId,
              startTime: startTime || new Date(),
            },
          }),
          prisma.user.update({
            where: { id: userId },
            data: { isClockedIn: true },
          }),
        ]);

        return res.status(201).json(newEntry);

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Time entries error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 