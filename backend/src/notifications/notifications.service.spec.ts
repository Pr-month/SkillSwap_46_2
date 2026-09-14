import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationPayload, NotificationType } from './notifications.types';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const repository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const payload: NotificationPayload = {
    type: NotificationType.NEW_REQUEST,
    skillName: 'TypeScript',
    fromUser: 'Алексей',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates and saves a notification for the recipient', async () => {
    const created = {
      recipient: { id: 'user-id' },
      ...payload,
    } as Notification;

    const saved = {
      ...created,
      id: 'notification-id',
      isRead: false,
      createdAt: new Date(),
    };

    repository.create.mockReturnValue(created);
    repository.save.mockResolvedValue(saved);

    await expect(service.create('user-id', payload)).resolves.toEqual(saved);

    expect(repository.create).toHaveBeenCalledWith({
      recipient: { id: 'user-id' },
      ...payload,
    });
    expect(repository.save).toHaveBeenCalledWith(created);
  });

  it('returns only notifications belonging to the current user', async () => {
    repository.find.mockResolvedValue([]);

    await expect(service.findAllForUser('user-id')).resolves.toEqual([]);

    expect(repository.find).toHaveBeenCalledWith({
      where: {
        recipient: { id: 'user-id' },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  });

  it('marks the current user notification as read', async () => {
    const notification = {
      id: 'notification-id',
      recipient: { id: 'user-id' },
      isRead: false,
      ...payload,
    } as Notification;

    repository.findOne.mockResolvedValue(notification);
    repository.save.mockImplementation((value: Notification) =>
      Promise.resolve(value),
    );

    const result = await service.markAsRead('notification-id', 'user-id');

    expect(repository.findOne).toHaveBeenCalledWith({
      where: {
        id: 'notification-id',
        recipient: { id: 'user-id' },
      },
    });
    expect(result.isRead).toBe(true);
    expect(repository.save).toHaveBeenCalledWith(notification);
  });

  it('does not allow access to a missing or foreign notification', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.markAsRead('notification-id', 'another-user-id'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('marks all unread notifications of the current user as read', async () => {
    repository.update.mockResolvedValue({ affected: 3 });

    await expect(service.markAllAsRead('user-id')).resolves.toEqual({
      updated: 3,
    });

    expect(repository.update).toHaveBeenCalledWith(
      {
        recipient: { id: 'user-id' },
        isRead: false,
      },
      {
        isRead: true,
      },
    );
  });
});
