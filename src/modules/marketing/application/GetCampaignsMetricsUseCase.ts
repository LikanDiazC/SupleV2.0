import { Injectable, Logger } from '@nestjs/common';
import { GoogleAdsIntegrationService } from '../infrastructure/ads/GoogleAdsIntegrationService';
import { AdCampaign } from '../domain/AdCampaign';

@Injectable()
export class GetCampaignsMetricsUseCase {
  private readonly logger = new Logger(GetCampaignsMetricsUseCase.name);

  constructor(
    private readonly googleAdsService: GoogleAdsIntegrationService
    // In the future: metaAdsService, tikTokAdsService
  ) {}

  async execute(tenantId: string): Promise<{ 
    metrics: { totalSpend: number, totalImpressions: number, totalClicks: number, totalConversions: number, averageCpc: number }, 
    campaigns: AdCampaign[]
  }> {
    let campaigns: AdCampaign[] = [];

    // 1. Fetch from Google Ads
    try {
      const googleAdsCampaigns = await this.googleAdsService.getCampaignMetrics(tenantId);
      campaigns = [...campaigns, ...googleAdsCampaigns];
    } catch (error: any) {
      this.logger.warn(`Failed to fetch from Google Ads: ${error.message}`);
      // No cortamos la ejecución si falla una API externa, devolvemos lo que tengamos o lanzamos error si es requerido.
    }

    // 2. Aggregate Global Metrics
    let totalSpend = 0, totalImpressions = 0, totalClicks = 0, totalConversions = 0;

    for (const c of campaigns) {
      totalSpend += c.spend;
      totalImpressions += c.impressions;
      totalClicks += c.clicks;
      totalConversions += c.conversions;
    }

    const averageCpc = totalClicks > 0 ? (totalSpend / totalClicks) : 0;

    return {
      metrics: {
        totalSpend,
        totalImpressions,
        totalClicks,
        totalConversions,
        averageCpc
      },
      campaigns: campaigns.sort((a, b) => b.spend - a.spend) // Ordenamos por las que más gastan
    };
  }
}
