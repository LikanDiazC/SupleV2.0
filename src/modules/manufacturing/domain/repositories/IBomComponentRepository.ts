import { BomComponent } from '../entities/BomComponent';

export interface IBomComponentRepository {
  save(component: BomComponent): Promise<void>;
  saveMany(components: BomComponent[]): Promise<void>;
  findByBomId(bomId: string, tenantId: string): Promise<BomComponent[]>;
}
