import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn , Index } from 'typeorm';

@Entity({ schema: 'marketing', name: 'ad_campaigns' })
export class AdCampaignOrmEntity {
  @PrimaryColumn('varchar', { length: 255 })
  id!: string; // Google Ads Campaign ID usually is numeric string like "12345678"

  @Index()
  @Column('uuid')
  tenantId!: string;

  @Column('varchar', { length: 50 })
  platform!: string; // GOOGLE, META, TIKTOK

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('varchar', { length: 50 })
  status!: string;

  // KPIs
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  spend!: number;

  @Column('int', { default: 0 })
  impressions!: number;

  @Column('int', { default: 0 })
  clicks!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  conversions!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  cpc!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
