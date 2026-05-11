import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  IsString, IsNotEmpty, IsNumber, IsArray, IsUUID,
  ArrayMinSize, ValidateNested, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { IBillOfMaterialsRepository } from '../../domain/repositories/IBillOfMaterialsRepository';
import { BillOfMaterials } from '../../domain/entities/BillOfMaterials';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

// DTOs para estructurar lo que recibimos del cliente
export class CreateBomComponentDto {
  @IsUUID()
  itemId!: string;

  @IsNumber() @Min(0.0001)
  quantity!: number;
}

export class CreateBomDto {
  @IsUUID()
  productId!: string;

  @IsString() @IsNotEmpty()
  name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBomComponentDto)
  components!: CreateBomComponentDto[];
}

@Injectable()
export class CreateBillOfMaterialsUseCase {
  constructor(
    @Inject('IBillOfMaterialsRepository')
    private readonly bomRepository: IBillOfMaterialsRepository,
  ) {}

  async execute(tenantId: string, dto: CreateBomDto): Promise<void> {
    try {
      // 1. Instanciamos el molde. Aquí saltarán los errores si la receta está vacía o tiene cantidades negativas.
      const bom = BillOfMaterials.create({
        tenantId: new TenantId(tenantId),
        productId: new UniqueId(dto.productId),
        name: dto.name,
        // Convertimos los strings a Value Objects (UniqueId)
        components: dto.components.map(c => ({
          itemId: new UniqueId(c.itemId),
          quantity: c.quantity,
        })),
      });

      // 2. Guardamos en la base de datos
      await this.bomRepository.save(bom);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}