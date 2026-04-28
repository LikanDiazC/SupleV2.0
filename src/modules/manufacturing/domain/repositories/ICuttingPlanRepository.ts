import { CuttingPlan } from '../entities/CuttingPlan';

export interface ICuttingPlanRepository {
  save(plan: CuttingPlan): Promise<void>;
  findByOrderId(orderId: string, tenantId: string): Promise<CuttingPlan[]>;
}
