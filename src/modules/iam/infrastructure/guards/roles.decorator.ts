import { SetMetadata } from '@nestjs/common';

// Esta función nos permitirá poner etiquetas como @Roles('ADMIN') en nuestras rutas
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);