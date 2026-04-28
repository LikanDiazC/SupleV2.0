export class AdCampaign {
  constructor(
    public readonly id: string,
    public readonly platform: 'GOOGLE' | 'META' | 'TIKTOK',
    public readonly name: string,
    public readonly status: 'ENABLED' | 'PAUSED' | 'REMOVED' | 'UNKNOWN',
    public readonly spend: number,
    public readonly impressions: number,
    public readonly clicks: number,
    public readonly conversions: number,
    public readonly cpc: number,
    public readonly expectedRoas: number
  ) {}

  public get calculatedCtr(): number {
    if (this.impressions === 0) return 0;
    return this.clicks / this.impressions;
  }
}
