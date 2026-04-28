import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IBillOfMaterialsRepository } from '../../domain/repositories/IBillOfMaterialsRepository';

@Injectable()
export class DeleteBomUseCase {
  constructor(
    @Inject('IBillOfMaterialsRepository')
    private readonly bomRepository: IBillOfMaterialsRepository,
  ) {}

  async execute(tenantId: string, bomId: string): Promise<void> {
    const bom = await this.bomRepository.findAll(tenantId);
    const exists = bom.some((b) => b.id.value === bomId);
    if (!exists) throw new NotFoundException('BOM no encontrado.');
    await this.bomRepository.delete(bomId, tenantId);
  }
}
