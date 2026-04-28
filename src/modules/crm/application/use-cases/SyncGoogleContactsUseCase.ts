import { Injectable, Inject } from '@nestjs/common';
import type { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import type { IContactRepository } from '../../domain/repositories/IContactRepository';
import { Company } from '../../domain/entities/Company';
import { Contact } from '../../domain/entities/Contact';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';
import { parse } from 'tldts';
import type { GoogleContactRaw } from '../../../communications/infrastructure/google/GoogleMailService';

export interface SyncResult {
  total:   number;
  created: number;
  skipped: number;
}

@Injectable()
export class SyncGoogleContactsUseCase {
  constructor(
    @Inject('ICompanyRepository') private readonly companyRepo: ICompanyRepository,
    @Inject('IContactRepository') private readonly contactRepo: IContactRepository,
  ) {}

  async execute(tenantId: string, googleContacts: GoogleContactRaw[]): Promise<SyncResult> {
    const publicDomains = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com']);
    let created = 0;
    let skipped = 0;

    for (const gc of googleContacts) {
      if (!gc.email) { skipped++; continue; }

      // ── Empresa ─────────────────────────────────────────────────────────────
      const parsed     = parse(gc.email);
      const cleanDomain = gc.domain
        ? parse(gc.domain).domain ?? gc.domain
        : parsed.domain ?? '';

      let company: Company | null = null;

      if (cleanDomain && !publicDomains.has(cleanDomain)) {
        company = await this.companyRepo.findByDomain(cleanDomain, tenantId);
        if (!company) {
          const baseName = gc.org || parsed.domainWithoutSuffix || cleanDomain.split('.')[0];
          company = Company.create({
            tenantId: new TenantId(tenantId),
            domain:   cleanDomain,
            name:     baseName.charAt(0).toUpperCase() + baseName.slice(1),
          });
          await this.companyRepo.save(company);
        }
      }

      // ── Contacto ─────────────────────────────────────────────────────────────
      const existing = await this.contactRepo.findByEmail(gc.email, tenantId);
      if (existing) { skipped++; continue; }

      const contact = Contact.create({
        tenantId:  new TenantId(tenantId),
        companyId: company ? company.id : (null as any),
        email:     gc.email,
        name:      gc.name || gc.email.split('@')[0],
      });
      await this.contactRepo.save(contact);
      created++;
    }

    return { total: googleContacts.length, created, skipped };
  }
}
