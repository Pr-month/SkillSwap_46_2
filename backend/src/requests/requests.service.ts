import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Request } from './entities/request.entity';
import { Skill } from '../skills/entities/skill.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestStatus } from './request-status.enums';
import { MailService } from '../mail/mail.service';

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    @InjectRepository(Request)
    private requestsRepository: Repository<Request>,
    @InjectRepository(Skill)
    private skillsRepository: Repository<Skill>,
    private readonly mailService: MailService,
  ) {}

  async create(
    createRequestDto: CreateRequestDto,
    senderId: string,
  ): Promise<Request> {
    let receiverEmail: string | undefined;
    let skillTitle: string | undefined;

    const saved = await this.requestsRepository.manager.transaction(
      async (manager) => {
        const skillRepo = manager.getRepository(Skill);
        const requestRepo = manager.getRepository(Request);

        const requestedSkill = await skillRepo.findOne({
          where: { id: createRequestDto.requestedSkillId },
          relations: ['user'],
        });

        if (!requestedSkill) {
          throw new NotFoundException('Навык не найден');
        }

        const offeredSkill = await skillRepo.findOne({
          where: { id: createRequestDto.offeredSkillId },
          relations: ['user'],
        });

        if (!offeredSkill) {
          throw new NotFoundException('Навык не найден');
        }

        if (offeredSkill.user?.id !== senderId) {
          throw new ForbiddenException(
            'Навык не принадлежит отправителю заявки',
          );
        }

        if (
          createRequestDto.offeredSkillId === createRequestDto.requestedSkillId
        ) {
          throw new BadRequestException('Навыки совпадают');
        }

        const receiverId = requestedSkill.user.id;

        if (senderId === receiverId) {
          throw new BadRequestException('Нельзя отправить заявку себе');
        }

        receiverEmail = requestedSkill.user.email;
        skillTitle = requestedSkill.title;

        const request = requestRepo.create({
          sender: { id: senderId },
          receiver: { id: receiverId },
          offeredSkill: { id: createRequestDto.offeredSkillId },
          requestedSkill: { id: createRequestDto.requestedSkillId },
        });

        return requestRepo.save(request);
      },
    );

    if (receiverEmail && skillTitle) {
      await this.sendNotification(
        receiverEmail,
        'Новая заявка на обмен навыками',
        `Поступила новая заявка на навык «${skillTitle}».`,
      );
    }

    return saved;
  }

  async findIncoming(userId: string): Promise<Request[]> {
    return this.requestsRepository.find({
      where: {
        receiver: { id: userId },
        status: In([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
      },
      relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOutgoing(userId: string): Promise<Request[]> {
    return this.requestsRepository.find({
      where: {
        sender: { id: userId },
        status: In([RequestStatus.PENDING, RequestStatus.IN_PROGRESS]),
      },
      relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    id: string,
    userId: string,
    status: typeof RequestStatus.ACCEPTED | typeof RequestStatus.REJECTED,
  ): Promise<Request> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: ['receiver', 'sender'],
    });

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    if (request.receiver.id !== userId) {
      throw new ForbiddenException('Недостаточно прав');
    }

    if (!Object.values(RequestStatus).includes(status)) {
      throw new BadRequestException('Некорректный статус');
    }

    request.status = status;
    request.isRead = true;

    const saved = await this.requestsRepository.save(request);

    if (request.sender?.email) {
      const statusText =
        status === RequestStatus.ACCEPTED ? 'принята' : 'отклонена';
      await this.sendNotification(
        request.sender.email,
        'Статус заявки обновлён',
        `Ваша заявка на обмен навыками была ${statusText}.`,
      );
    }

    return saved;
  }

  private async sendNotification(
    email: string,
    subject: string,
    text: string,
  ): Promise<void> {
    try {
      await this.mailService.sendUserNotification(email, { subject, text });
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}`, error as Error);
    }
  }

  async markRead(id: string, userId: string): Promise<Request> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: ['receiver'],
    });

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    if (request.receiver.id !== userId) {
      throw new ForbiddenException('Недостаточно прав');
    }

    request.isRead = true;
    return this.requestsRepository.save(request);
  }

  async remove(
    id: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<{ message: string }> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: ['sender'],
    });

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    if (!isAdmin && request.sender.id !== userId) {
      throw new ForbiddenException('Недостаточно прав');
    }

    await this.requestsRepository.delete(id);
    return { message: 'Заявка удалена' };
  }
}
