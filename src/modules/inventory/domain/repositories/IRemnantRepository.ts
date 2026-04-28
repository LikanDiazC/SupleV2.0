import { Remnant } from '../entities/Remnant';

export interface IRemnantRepository {
  save(remnant: Remnant): Promise<void>;
  findAll(tenantId: string): Promise<Remnant[]>;
  findByMaterialId(materialId: string, tenantId: string): Promise<Remnant[]>;
  findByDimensions(materialId: string, widthMm: number, heightMm: number, tenantId: string): Promise<Remnant | null>;
}
