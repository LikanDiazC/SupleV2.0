import { BillOfMaterials } from '../entities/BillOfMaterials';

export interface IBillOfMaterialsRepository {
  save(bom: BillOfMaterials): Promise<void>;
  delete(id: string, tenantId: string): Promise<void>;
  findById(id: string, tenantId: string): Promise<BillOfMaterials | null>;
  findByProductId(productId: string, tenantId: string): Promise<BillOfMaterials | null>;
  findAll(tenantId: string): Promise<BillOfMaterials[]>;
}
