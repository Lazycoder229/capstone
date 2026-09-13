import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	serverExternalPackages: ["typeorm", "mysql2", "mysql"],
	devIndicators: false,
}

export default nextConfig
