export abstract class ValueObject<T extends { [key: string]: any }> {
  public readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props); // Lo congelamos para que nadie pueda modificarlo después de creado
  }

  // Compara si dos Objetos de Valor son exactamente iguales en todos sus atributos
  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (vo.props === undefined) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}