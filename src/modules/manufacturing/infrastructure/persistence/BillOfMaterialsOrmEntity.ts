import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('bill_of_materials')
export class BillOfMaterialsOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  productId!: string; // El ID del producto que se fabrica (apunta a la tabla items)

  @Column('varchar')
  name!: string;

  // Aquí vive la magia: Guardamos el array de componentes como JSON binario
  // Estructura: [{ itemId: "uuid", quantity: 5 }, ...]
  @Column('jsonb')
  components!: any[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}