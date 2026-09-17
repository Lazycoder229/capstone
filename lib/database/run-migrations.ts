import { AppDataSource } from "./data-source.js"

async function main() {
  console.log("Connecting to database...")
  try {
    await AppDataSource.initialize()
    console.log("Database connected successfully.")

    console.log("Checking and executing pending migrations...")
    const migrations = await AppDataSource.runMigrations()

    if (migrations.length === 0) {
      console.log("✓ No pending migrations to run. Database schema is already up to date.")
    } else {
      console.log(`✓ Successfully executed ${migrations.length} migration(s):`)
      migrations.forEach((m) => console.log(`  - [DONE] ${m.name}`))
    }
  } catch (error) {
    console.error("Migration execution error:", error)
    process.exit(1)
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy()
      console.log("Database connection closed.")
    }
  }
}

main()
