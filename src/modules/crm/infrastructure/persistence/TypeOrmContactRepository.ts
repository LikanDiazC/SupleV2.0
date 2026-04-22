import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactOrmEntity } from './orm-entities/ContactOrmEntity';
import { Contact } from '../../domain/entities/Contact';
import type { IContactRepository } from '../../domain/repositories/IContactRepository';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

@Injectable()
export class TypeOrmContactRepository implements IContactRepository {
  constructor(
    @InjectRepository(ContactOrmEntity)
    private readonly ormRepo: Repository<ContactOrmEntity>,
  ) {}

  async save(contact: Contact): Promise<void> {
    const ormEntity = this.ormRepo.create({
      id: contact.id.value,
      tenantId: contact.tenantId.value,
      companyId: contact.companyId ? contact.companyId.value : null,
      email: contact.email,
      name: contact.name,
      createdAt: contact['createdAt'] || new Date(),
    });
    await this.ormRepo.save(ormEntity);
  }

  async findByEmail(email: string, tenantId: string): Promise<Contact | null> {
    const ormEntity = await this.ormRepo.findOne({ where: { email, tenantId } });
    if (!ormEntity) return null;

    return Contact.create({
      tenantId: new TenantId(ormEntity.tenantId),
      companyId: ormEntity.companyId ? new UniqueId(ormEntity.companyId) : null as any,
      email: ormEntity.email,
      name: ormEntity.name,
    }, new UniqueId(ormEntity.id));
  }

  async findByCompany(companyId: string, tenantId: string): Promise<Contact[]> {
    const ormEntities = await this.ormRepo.find({ where: { companyId, tenantId } });
    return ormEntities.map(orm => Contact.create({
      tenantId: new TenantId(orm.tenantId),
      companyId: orm.companyId ? new UniqueId(orm.companyId) : null as any,
      email: orm.email,
      name: orm.name,
    }, new UniqueId(orm.id)));
  }

  async findAll(tenantId: string): Promise<Contact[]> {
    // 💡 Dato: Usamos relations: ['company'] para traer el nombre de la empresa en la misma consulta
    const ormEntities = await this.ormRepo.find({ 
      where: { tenantId },
      relations: ['company'], 
      order: { name: 'ASC' }
    });
    
    // Convertimos al modelo de dominio (Y fíjate que ya no usamos "as any" gracias a tu corrección)
    return ormEntities.map(orm => Contact.create({
      tenantId: new TenantId(orm.tenantId),
      companyId: orm.companyId ? new UniqueId(orm.companyId) : null,
      email: orm.email,
      name: orm.name,
    }, new UniqueId(orm.id)));
  }
}