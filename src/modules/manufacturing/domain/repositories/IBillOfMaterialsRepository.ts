import { BillOfMaterials } from '../entities/BillOfMaterials';

export interface IBillOfMaterialsRepository {
  // Por ahora solo necesitamos poder guardar la receta nueva
  save(bom: BillOfMaterials): Promise<void>;
  findByProductId(productId: string, tenantId: string): Promise<BillOfMaterials | null>;
}