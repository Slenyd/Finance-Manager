import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

export class GoalService {
  async findAll(userId: string) {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((goal) => ({
      ...goal,
      progress: Number(goal.targetAmount) > 0 ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 : 0,
    }));
  }

  async findById(userId: string, id: string) {
    const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
    if (!goal) throw new NotFoundError('Savings goal');
    return {
      ...goal,
      progress: Number(goal.targetAmount) > 0 ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 : 0,
    };
  }

  async create(userId: string, data: { name: string; targetAmount: number; currentAmount?: number; deadline?: string | null }) {
    return prisma.savingsGoal.create({
      data: {
        userId,
        name: data.name,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount || 0,
        ...(data.deadline && { deadline: new Date(data.deadline) }),
      },
    });
  }

  async update(userId: string, id: string, data: any) {
    await this.findById(userId, id);
    return prisma.savingsGoal.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.targetAmount && { targetAmount: data.targetAmount }),
        ...(data.currentAmount !== undefined && { currentAmount: data.currentAmount }),
        ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
      },
    });
  }

  async delete(userId: string, id: string) {
    await this.findById(userId, id);
    await prisma.savingsGoal.delete({ where: { id } });
  }

  async contribute(userId: string, id: string, amount: number) {
    const goal = await this.findById(userId, id);
    return prisma.savingsGoal.update({
      where: { id },
      data: { currentAmount: Number(goal.currentAmount) + amount },
    });
  }
}
