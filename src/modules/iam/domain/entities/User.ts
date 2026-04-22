import { Entity } from '../../../../shared/kernel/Entity';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../value-objects/TenantId';

// 1. Definimos qué datos componen a un Usuario
export interface UserProps {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  tenantId: TenantId;
  role: string; // Por ahora lo dejamos como string, pero podríamos crear un Value Object o una Enum para esto
  // (Más adelante conectaremos el Rol y el Tenant aquí)
}

// 2. Creamos la clase extendiendo de nuestro molde Kernel (Entity)
export class User extends Entity<UserProps> {
  
  // El constructor es privado para obligar a usar el método 'create'
  private constructor(props: UserProps, id?: UniqueId) {
    super(props, id);
  }

  // 3. Getters: Permiten leer los datos, pero evitan que alguien los modifique por error
  get email(): string { return this.props.email; }
  get firstName(): string { return this.props.firstName; }
  get lastName(): string { return this.props.lastName; }
  get passwordHash(): string { return this.props.passwordHash; }
  get isActive(): boolean { return this.props.isActive; }
  get tenantId(): TenantId { return this.props.tenantId; }
  get role(): string { return this.props.role; }

  // 4. Factory Method: La ÚNICA forma oficial de crear un Usuario en el sistema
  public static create(props: UserProps, id?: UniqueId): User {
    // 💡 Aquí es donde van las Reglas de Negocio. 
    // Por ejemplo, podríamos lanzar un error si el email no tiene un '@'
    
    return new User({
      ...props,
      isActive: props.isActive !== undefined ? props.isActive : true,
      role: props.role ?? 'USER' // Por defecto nace como usuario normal
    }, id);
  }

  // 5. Comportamientos: Acciones que este objeto puede realizar
  public desactivate(): void {
    this.props.isActive = false;
  }
}