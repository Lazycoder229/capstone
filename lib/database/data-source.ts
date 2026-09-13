import dotenv from "dotenv"
import { DataSource } from "typeorm"

import { AppUserEntity, domainEntities } from "./entities/index.js"

dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env" })

const dataSourceOptions = process.env.DATABASE_URL
  ? {
      type: "mysql" as const,
      url: process.env.DATABASE_URL,
      connectorPackage: "mysql2" as const,
      synchronize: false,
      migrations: ["lib/database/migrations/*.ts"],
      entities: [AppUserEntity, ...domainEntities],
    }
  : {
      type: "mysql" as const,
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT ?? 3306),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      connectorPackage: "mysql2" as const,
      synchronize: false,
      migrations: ["lib/database/migrations/*.ts"],
      entities: [AppUserEntity, ...domainEntities],
    }

export const AppDataSource = new DataSource(dataSourceOptions)

export async function getDatabase() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  return AppDataSource
}
