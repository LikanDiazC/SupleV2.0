import { UniqueId } from '../../../../shared/kernel/UniqueId';

export class Tenant {
  private constructor(
    public readonly id: UniqueId,
    public readonly name: string,
    public readonly isActive: boolean,
  ) {}

  // Esta es la fábrica que crea la Empresa
  static create(props: { name: string; isActive?: boolean }, id?: UniqueId): Tenant {
    return new Tenant(
      id ?? new UniqueId(), // Si no nos pasan un ID, generamos uno nuevo automáticamente
      props.name,
      props.isActive ?? true, // Por defecto, la empresa nace "activa"
    );
  }
}