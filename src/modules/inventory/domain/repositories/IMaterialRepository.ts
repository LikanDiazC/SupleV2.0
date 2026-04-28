import { Material } from '../entities/Material';

export interface IMaterialRepository {
  save(material: Material): Promise<void>;
  findAll(tenantId: string, type?: string, limit?: number, offset?: number): Promise<Material[]>;
  findById(id: string, tenantId: string): Promise<Material | null>;
}
