import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository, GoogleTokens } from '../../domain/repositories/IUserRepository';
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
      mustChangePassword: user.mustChangePassword,
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
    // 💡 Le decimos a TypeORM que traiga la relación 'tenant'
    const ormEntity = await this.ormRepository.findOne({ 
      where: { email },
      relations: ['tenant'] 
    });
    
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

  async saveGoogleTokens(userId: string, tokens: GoogleTokens): Promise<void> {
    await this.ormRepository.update(userId, {
      googleAccessToken:  tokens.access_token  ?? undefined,
      googleRefreshToken: tokens.refresh_token ?? undefined,
      googleTokenExpiry:  tokens.expiry_date   ?? undefined,
    });
  }

  async getGoogleTokens(userId: string): Promise<GoogleTokens | null> {
    const row = await this.ormRepository.findOne({ where: { id: userId } });
    if (!row?.googleRefreshToken) return null;
    return {
      access_token:  row.googleAccessToken,
      refresh_token: row.googleRefreshToken,
      expiry_date:   row.googleTokenExpiry ? Number(row.googleTokenExpiry) : undefined,
    };
  }

  async hasGoogleLinked(userId: string): Promise<boolean> {
    const row = await this.ormRepository.findOne({ where: { id: userId } });
    return !!row?.googleRefreshToken;
  }

  async changePassword(userId: string, newHash: string): Promise<void> {
    await this.ormRepository.update(userId, {
      passwordHash: newHash,
      mustChangePassword: false,
    });
  }

  private mapToDomain(ormEntity: UserOrmEntity): User {
    return User.create(
      {
        email: ormEntity.email,
        passwordHash: ormEntity.passwordHash,
        firstName: ormEntity.firstName,
        lastName: ormEntity.lastName,
        isActive: ormEntity.isActive,
        tenantId: new TenantId(ormEntity.tenantId),
        tenantName: ormEntity.tenant?.name,
        role: ormEntity.role,
        mustChangePassword: ormEntity.mustChangePassword,
      },
      new UniqueId(ormEntity.id),
    );
  }
}