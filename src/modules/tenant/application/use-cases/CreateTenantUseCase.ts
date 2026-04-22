import { Injectable, Inject } from '@nestjs/common';
import type { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { CreateTenantDto } from '../dtos/CreateTenantDto';
import { Tenant } from '../../domain/entities/Tenant';

@Injectable()
export class CreateTenantUseCase {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(dto: CreateTenantDto): Promise<{ id: string; message: string }> {
    // 1. Creamos la empresa usando las reglas del Dominio
    const tenant = Tenant.create({ name: dto.name });
    
    // 2. Mandamos a guardarla a la base de datos
    await this.tenantRepository.save(tenant);

    // 3. Devolvemos el ID generado, ¡nos servirá para asociarle usuarios luego!
    return { 
      message: '¡Empresa creada exitosamente!',
      id: tenant.id.value 
    };
  }
}