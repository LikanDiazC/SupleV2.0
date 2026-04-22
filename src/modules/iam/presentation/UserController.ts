import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req } from '@nestjs/common';
import { CreateUserUseCase } from '../application/use-cases/CreateUserUseCase';
import { GetAllUsersUseCase } from '../application/use-cases/GetAllUsersUseCase';
import { CreateUserDto } from '../application/dtos/CreateUserDto';
import { LoginUseCase } from '../application/use-cases/LoginUseCase';
import { LoginDto } from '../application/dtos/LoginDto';
import { JwtAuthGuard } from '../infrastructure/guards/JwtAuthGuard';
import { Roles } from '../infrastructure/guards/roles.decorator';
import { RolesGuard } from '../infrastructure/guards/RolesGuard';

// @Controller('users') significa que este archivo escuchará peticiones en la ruta "http://localhost:3000/users"
@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  // @Post() significa que escuchará el método HTTP POST (que se usa para crear datos)
  @Post()
  @HttpCode(HttpStatus.CREATED) // Devuelve un código 201 de "Creado exitosamente"
  async createUser(@Body() dto: CreateUserDto): Promise<{ message: string }> {
    
    // Le pasamos el paquete de datos al Director de Orquesta (el Caso de Uso)
    await this.createUserUseCase.execute(dto);
    
    // Si no explotó nada en el Caso de Uso, devolvemos un mensaje de éxito
    return {
      message: '¡Usuario creado exitosamente!',
    };
  }
  @Roles('ADMIN','SUPERADMIN') // Solo los ADMIN pueden ver la lista de usuarios
  @UseGuards(JwtAuthGuard, RolesGuard) // ¡Protegemos esta ruta con nuestro guardia de JWT!
  @Get()
  async getAllUsers(@Req() request: Request) {
    const userPayload = request['user'] as any;
    return await this.getAllUsersUseCase.execute(userPayload.tenantId,userPayload.role);
}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return await this.loginUseCase.execute(dto);
  }
}