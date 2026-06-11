import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';

export interface LogActivityParams {
  staffId: string;
  staffName: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityLabel?: string;
  details?: Record<string, any>;
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityLog)
    private activityRepository: Repository<ActivityLog>,
  ) {}

  async log(params: LogActivityParams): Promise<void> {
    const log = this.activityRepository.create({
      staffId: params.staffId,
      staffName: params.staffName,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityLabel: params.entityLabel,
      details: params.details,
    });
    await this.activityRepository.save(log);
  }

  async getAll(page = 1, limit = 20): Promise<{ logs: ActivityLog[]; total: number }> {
    const cappedLimit = Math.min(limit, 100);
    const [logs, total] = await this.activityRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * cappedLimit,
      take: cappedLimit,
    });
    return { logs, total };
  }

  async getByStaff(staffId: string, page = 1, limit = 20): Promise<{ logs: ActivityLog[]; total: number }> {
    const cappedLimit = Math.min(limit, 100);
    const [logs, total] = await this.activityRepository.findAndCount({
      where: { staffId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * cappedLimit,
      take: cappedLimit,
    });
    return { logs, total };
  }

  async getStaffSummary(staffId: string): Promise<{ totalActions: number; lastActionAt: Date | null }> {
    const total = await this.activityRepository.count({ where: { staffId } });
    const last = await this.activityRepository.findOne({
      where: { staffId },
      order: { createdAt: 'DESC' },
    });
    return { totalActions: total, lastActionAt: last?.createdAt ?? null };
  }
}
