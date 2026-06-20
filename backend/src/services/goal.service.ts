import { Prisma, SavingsGoal } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';
import { SavingsGoalWithProgress, CreateGoalData, UpdateGoalData } from '../interfaces';

export class GoalService {
  async findAll(userId: string): Promise<SavingsGoalWithProgress[]> {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((goal) => ({
      ...goal,
      progress: Number(goal.targetAmount) > 0 ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 : 0,
    }));
  }

  async findById(userId: string, id: string): Promise<SavingsGoalWithProgress> {
    const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
    if (!goal) throw new NotFoundError('Savings goal');
    return {
      ...goal,
      progress: Number(goal.targetAmount) > 0 ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 : 0,
    };
  }

  async create(userId: string, data: CreateGoalData): Promise<SavingsGoal> {
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

  async update(userId: string, id: string, data: UpdateGoalData): Promise<SavingsGoal> {
    await this.findById(userId, id);
    return prisma.savingsGoal.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
        ...(data.currentAmount !== undefined && { currentAmount: data.currentAmount }),
        ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
      },
    });
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.findById(userId, id);
    await prisma.savingsGoal.delete({ where: { id } });
  }

  async contribute(userId: string, id: string, amount: number): Promise<SavingsGoal> {
    if (amount <= 0) {
      throw new ValidationError({ amount: ['Contribution amount must be positive'] });
    }
    await this.findById(userId, id);
    return prisma.savingsGoal.update({
      where: { id },
      data: { currentAmount: { increment: new Prisma.Decimal(amount) } },
    });
  }
}