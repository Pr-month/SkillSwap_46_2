import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationPayload } from './notifications.types';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  async create(
    recipientId: string,
    payload: NotificationPayload,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      recipient: { id: recipientId },
      ...payload,
    });

    return this.notificationsRepository.save(notification);
  }

  async findAllForUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: {
        recipient: { id: userId },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: {
        id,
        recipient: { id: userId },
      },
    });

    if (!notification) {
      throw new NotFoundException('Уведомление не найдено');
    }

    notification.isRead = true;

    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationsRepository.update(
      {
        recipient: { id: userId },
        isRead: false,
      },
      {
        isRead: true,
      },
    );

    return {
      updated: result.affected ?? 0,
    };
  }
}
