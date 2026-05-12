export interface OrderStatusConfig {
  key: string;
  label: string;
  color: string;
}

export interface ExtraFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'date' | 'select';
  required: boolean;
}

export interface NotifStepConfig {
  key: string;
  label: string;
}

export class TenantConfig {
  constructor(
    public readonly tenantId: string,
    public readonly orderTypes: string[],
    public readonly orderStatuses: OrderStatusConfig[],
    public readonly extraFields: ExtraFieldConfig[],
    public readonly notifSteps: NotifStepConfig[],
    public readonly requireDesignConfirmation: boolean = false,
    public readonly notifAutoTriggers: Record<string, string[]> = {},
  ) {}

  static empty(tenantId: string): TenantConfig {
    return new TenantConfig(tenantId, [], [], [], [], false, {});
  }
}
