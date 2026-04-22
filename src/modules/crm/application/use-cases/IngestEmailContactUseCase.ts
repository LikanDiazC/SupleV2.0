import { Injectable, Inject } from '@nestjs/common';
import type { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import type { IContactRepository } from '../../domain/repositories/IContactRepository';
import { Company } from '../../domain/entities/Company';
import { Contact } from '../../domain/entities/Contact';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';
import { parse } from 'tldts';

@Injectable()
export class IngestEmailContactUseCase {
  constructor(
    @Inject('ICompanyRepository') private readonly companyRepo: ICompanyRepository,
    @Inject('IContactRepository') private readonly contactRepo: IContactRepository,
  ) {}

async execute(tenantId: string, fromHeader: string): Promise<{ company: Company | null, contact: Contact } | null> {
    const regex = /(?:(.*)\s+)?<?([\w\.-]+@[\w\.-]+\.\w+)>?/;
    const match = fromHeader.match(regex);

    if (!match) return null;

    const rawName = match[1]?.replace(/['"]/g, '').trim() || ''; 
    const email = match[2].toLowerCase(); 
    
    // 🌟 LA MAGIA ESCALABLE: Esto limpia subdominios y reconoce países automáticamente
    const parsed = parse(email);
    const cleanDomain = parsed.domain; // Extrae "bci.cl", "notion.so" o "empresa.com.mx"

    // Si por alguna razón el correo es inválido y no tiene dominio, abortamos
    if (!cleanDomain) return null;

    // Dominios públicos que NO son empresas
    const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    const isPublic = publicDomains.includes(cleanDomain);

    // 3. Mejorar el Nombre de la Empresa
    let company: Company | null = null;
    
    if (!isPublic) {
      company = await this.companyRepo.findByDomain(cleanDomain, tenantId); 
      if (!company) {
        // Sacamos la palabra principal (ej: "notion" de "notion.so") y la capitalizamos
        const nombreBase = parsed.domainWithoutSuffix || cleanDomain.split('.')[0];
        const nombreCapitalizado = nombreBase.charAt(0).toUpperCase() + nombreBase.slice(1);
        
        const finalCompanyName = (rawName && rawName.length < 25) ? rawName : nombreCapitalizado;

        company = Company.create({
          tenantId: new TenantId(tenantId),
          domain: cleanDomain, 
          name: finalCompanyName, 
        });
        await this.companyRepo.save(company);
      }
    }

    // 4. Buscar o crear el Contacto
    let contact = await this.contactRepo.findByEmail(email, tenantId);
    if (!contact) {
      contact = Contact.create({
        tenantId: new TenantId(tenantId),
        companyId: company ? company.id : null as any, 
        email: email, 
        name: rawName || email.split('@')[0], 
      });
      await this.contactRepo.save(contact);
    }

    return { company, contact };
  }
}