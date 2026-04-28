import { AdCampaign } from '../../domain/AdCampaign';

export interface IAdsService {
  /**
   * Obtiene la métrica de campañas activa para el último periodo (ej: Últimos 30 días)
   */
  getCampaignMetrics(tenantId?: string): Promise<AdCampaign[]>;
}
