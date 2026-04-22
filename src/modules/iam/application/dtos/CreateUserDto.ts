// Este es el "molde" de los datos que nos enviará Postman o el Frontend
export class CreateUserDto {
  email!: string;
  password!: string;
  firstName!: string;
  lastName!: string;
  tenantId!: string;
}