import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { UserOrmEntity } from './UserOrmEntity';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../domain/value-objects/TenantId';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepository: Repository<UserOrmEntity>,
  ) {}

  // Guarda o actualiza un usuario
  async save(user: User): Promise<void> {
    const ormEntity = this.ormRepository.create({
      id: user.id.value,
      email: user.email,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      tenantId: user.tenantId.value,
      role: user.role,
    });

    await this.ormRepository.save(ormEntity);
  }

  // Busca por ID
  async findById(id: UniqueId): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id: id.value } });
    if (!ormEntity) return null;
    return this.mapToDomain(ormEntity);
  }

  // Busca por Email
  async findByEmail(email: string): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { email } });
    if (!ormEntity) return null;
    return this.mapToDomain(ormEntity);
  }
  // Busca por TenantId
  async findByTenantId(tenantId: TenantId): Promise<User[]> {
    const ormEntities = await this.ormRepository.find({ 
      where: { tenantId: tenantId.value } 
    });
    return ormEntities.map(ormEntity => this.mapToDomain(ormEntity));
  }
  //buscar por todos los usuarios
async findAll(tenantId?: string): Promise<User[]> {
    // Si nos pasan un tenantId, filtramos. Si no (SUPERADMIN), buscamos todo vacío {}
    const whereCondition = tenantId ? { tenantId: tenantId } : {}; 

    const ormEntities = await this.ormRepository.find({
      where: whereCondition
    });
    return ormEntities.map(ormEntity => this.mapToDomain(ormEntity));
  }

  // Traductor: de la BD al Dominio
  private mapToDomain(ormEntity: UserOrmEntity): User {
    return User.create(
      {
        email: ormEntity.email,
        passwordHash: ormEntity.passwordHash,
        firstName: ormEntity.firstName,
        lastName: ormEntity.lastName,
        isActive: ormEntity.isActive,
        tenantId: new TenantId(ormEntity.tenantId),
        role: ormEntity.role,
      },
      new UniqueId(ormEntity.id),
    );
  }
}