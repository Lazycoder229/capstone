export const metadata = {
  title: "PRIME Employee Portal",
  description: "View your attendance and payslips in PRIME POS.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PRIME Employee",
  },
  icons: { apple: "/apple-icon.png" },
}

export default function EmployeeRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
