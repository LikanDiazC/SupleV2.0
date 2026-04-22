import { DealActivity } from '../entities/DealActivity';

export interface IDealActivityRepository {
  save(activity: DealActivity): Promise<void>;
  findByDealId(dealId: string, tenantId: string): Promise<DealActivity[]>;
}