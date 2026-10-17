import { Column, Entity, PrimaryColumn } from "typeorm"
import { decimal } from "./transformers"

/** Single-row settings table. */
@Entity("loyalty_settings")
export class LoyaltySetting {
  @PrimaryColumn({ type: "char", length: 36 })
  id!: string

  @Column({ name: "points_per_tier", type: "int", default: 5 })
  pointsPerTier!: number

  @Column({
    name: "peso_value_per_point",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.25,
    transformer: decimal,
  })
  pesoValuePerPoint!: number

  @Column({ name: "updated_at", type: "timestamp", nullable: true })
  updatedAt!: Date | null
}
