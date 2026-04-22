import { v4 as uuidv4, validate } from 'uuid';

export class UniqueId {
  private readonly _value: string;

  constructor(id?: string) {
    if (id && !validate(id)) {
      throw new Error('El ID proporcionado no es un UUID válido');
    }
    this._value = id ? id : uuidv4();
  }

  get value(): string {
    return this._value;
  }

  public equals(id?: UniqueId): boolean {
    if (id === null || id === undefined) {
      return false;
    }
    if (!(id instanceof this.constructor)) {
      return false;
    }
    return id.value === this.value;
  }
}