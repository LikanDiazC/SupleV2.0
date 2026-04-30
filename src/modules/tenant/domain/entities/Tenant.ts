import { UniqueId } from '../../../../shared/kernel/UniqueId';

export class Tenant {
  private constructor(
    public readonly id: UniqueId,
    public readonly name: string,
    public readonly isActive: boolean,
    public readonly shopifyAccessToken?: string,
  ) {}

  static create(props: { name: string; isActive?: boolean; shopifyAccessToken?: string }, id?: UniqueId): Tenant {
    return new Tenant(
      id ?? new UniqueId(),
      props.name,
      props.isActive ?? true,
      props.shopifyAccessToken,
    );
  }
}