import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketingController } from './presentation/MarketingController';
import { GetCampaignsMetricsUseCase } from './application/GetCampaignsMetricsUseCase';
import { GoogleAdsIntegrationService } from './infrastructure/ads/GoogleAdsIntegrationService';
import { AdCampaignOrmEntity } from './infrastructure/persistence/orm-entities/AdCampaignOrmEntity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdCampaignOrmEntity
    ])
  ],
  controllers: [MarketingController],
  providers: [
    GetCampaignsMetricsUseCase,
    GoogleAdsIntegrationService
  ],
  exports: [GetCampaignsMetricsUseCase]
})
export class MarketingModule {}
