// app/admin/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingBag,
  CreditCard,
  QrCode,
  Table2,
  CalendarCheck,
  AlertTriangle,
  Plus,
  UtensilsCrossed,
  Tag,
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  FileX,
  ShelvingUnit,
  Clock,
  Smartphone,
  Store,
  DollarSign,
  Activity,
  Layers,
} from "lucide-react";
import { fetchDashboardMetrics, type DashboardData } from "@/app/actions/dashboard";

const statusBadgeStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  preparing: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  ready: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  served: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  confirmed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const loadData = () => {
    startTransition(async () => {
      try {
        const res = await fetchDashboardMetrics();
        if (res.success && res.data) {
          setData(res.data);
          setLastUpdated(
            new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
          );
        }
      } finally {
        setIsLoading(false);
      }
    });
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds for live telemetry
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const kpis = data?.kpis;
  const paymentMethods = data?.paymentMethods || [];
  const activeOrders = data?.activeOrders || [];
  const todayReservations = data?.todayReservations || [];
  const topSellingItems = data?.topSellingItems || [];
  const alerts = data?.alerts || [];
  const orderStatusCounts = data?.orderStatusCounts;


  return (
    <div className="w-full max-w-full min-w-0 space-y-5 pb-16 sm:pb-8">
      {/* Top Header & Executive Controls */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Executive Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
            {lastUpdated && (
              <span className="text-[11px] text-muted-foreground hidden md:inline">
                Synced at {lastUpdated}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {data?.systemConfig ? (
              <span className="font-medium text-foreground mr-1">
                {data.systemConfig.restaurantName} ({data.systemConfig.branchName}) ·
              </span>
            ) : null}
            Real-time financial KPIs, kitchen queue telemetry, and floor occupancy.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isPending}
            className="h-9 gap-1.5 text-xs font-medium cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button className="bg-amber-500 text-neutral-950 hover:bg-amber-400 font-semibold shadow-xs h-9 text-xs sm:text-sm flex-1 sm:flex-none cursor-pointer">
                  <Plus className="mr-1.5 size-3.5" />
                  Quick Actions
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem className="p-0 cursor-pointer">
                <Link href="/admin/menu" className="flex items-center gap-2 w-full px-2 py-1.5">
                  <UtensilsCrossed className="size-4 text-amber-500" />
                  Add Menu Item
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-0 cursor-pointer">
                <Link href="/admin/reservations" className="flex items-center gap-2 w-full px-2 py-1.5">
                  <CalendarCheck className="size-4 text-sky-500" />
                  New Reservation
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-0 cursor-pointer">
                <Link href="/admin/tables" className="flex items-center gap-2 w-full px-2 py-1.5">
                  <QrCode className="size-4 text-emerald-500" />
                  Generate Table QR
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-0 cursor-pointer">
                <Link href="/admin/discounts" className="flex items-center gap-2 w-full px-2 py-1.5">
                  <Tag className="size-4 text-purple-500" />
                  Manage Discounts
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-0 cursor-pointer">
                <Link href="/admin/inventory" className="flex items-center gap-2 w-full px-2 py-1.5">
                  <ShelvingUnit className="size-4 text-indigo-500" />
                  Inspect Inventory
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-0 cursor-pointer">
                <Link href="/admin/voids" className="flex items-center gap-2 w-full px-2 py-1.5">
                  <FileX className="size-4 text-rose-500" />
                  Order Void Log
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>

          </DropdownMenu>
        </div>
      </div>

      {/* Critical Operational Attention Alerts (Banner) */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {alerts.map((alert) => (
            <Link
              key={alert.id}
              href={alert.href || "/admin"}
              className={`group flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                alert.type === "danger"
                  ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                  : alert.type === "warning"
                  ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                  : "border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10"
              }`}
            >
              <AlertTriangle
                className={`mt-0.5 size-4 shrink-0 ${
                  alert.type === "danger"
                    ? "text-destructive"
                    : alert.type === "warning"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-sky-600 dark:text-sky-400"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground truncate">{alert.title}</p>
                  <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{alert.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Primary Executive KPI Grid (5 High-Impact Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 w-full min-w-0">
        {/* KPI 1: Gross Sales Revenue */}
        <Card className="min-w-0 border bg-card shadow-xs relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between p-3.5 pb-1 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              {isLoading ? "..." : kpis?.revenue.formatted || "₱0.00"}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <TrendingUp className="size-3 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate">{kpis?.revenue.trendText || "Payments recorded"}</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Average Order Value (AOV) */}
        <Card className="min-w-0 border bg-card shadow-xs relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between p-3.5 pb-1 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Avg Order Value (AOV)
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CreditCard className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              {isLoading ? "..." : kpis?.averageOrderValue.formatted || "₱0.00"}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground truncate">
              {kpis?.averageOrderValue.subtitle || "Ticket average"}
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Orders Volume & Fulfillment */}
        <Card className="min-w-0 border bg-card shadow-xs relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between p-3.5 pb-1 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Order Volume
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              {isLoading ? "..." : `${kpis?.orders.total || 0}`}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {kpis?.orders.active || 0} in kitchen
              </span>
              <span className="text-muted-foreground">
                {kpis?.orders.fulfillmentRate || 0}% fulfilled
              </span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Floor & Table Occupancy */}
        <Card className="min-w-0 border bg-card shadow-xs relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500" />
          <CardHeader className="flex flex-row items-center justify-between p-3.5 pb-1 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Table Occupancy
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Table2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              {isLoading
                ? "..."
                : `${kpis?.tables.occupied || 0} / ${kpis?.tables.total || 0}`}
            </div>
            <div className="mt-1 space-y-1">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${kpis?.tables.rate || 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{kpis?.tables.rate || 0}% capacity</span>
                <span>{kpis?.tables.subtitle}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 5: Channel Split (QR vs POS) */}
        <Card className="min-w-0 border bg-card shadow-xs relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-violet-500" />
          <CardHeader className="flex flex-row items-center justify-between p-3.5 pb-1 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              QR Ordering Share
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <QrCode className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              {isLoading ? "..." : `${kpis?.channelSplit.qrPercentage || 0}%`}
            </div>
            <div className="mt-1 space-y-1">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-violet-500 transition-all duration-500"
                  style={{ width: `${kpis?.channelSplit.qrPercentage || 0}%` }}
                />
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${kpis?.channelSplit.counterPercentage || 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Smartphone className="size-3 text-violet-500" />
                  {kpis?.channelSplit.qrCount || 0} QR
                </span>
                <span className="flex items-center gap-1">
                  <Store className="size-3 text-amber-500" />
                  {kpis?.channelSplit.counterCount || 0} Counter
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Queue Status Ribbon */}
      {orderStatusCounts && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <Activity className="size-3.5" />
            Kitchen Pipeline:
          </span>
          <div className="flex items-center gap-2 flex-nowrap shrink-0">
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 font-medium border-amber-500/30 bg-amber-500/5">
              <span className="size-1.5 rounded-full bg-amber-500" />
              Pending: <strong className="text-foreground">{orderStatusCounts.pending}</strong>
            </Badge>
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 font-medium border-blue-500/30 bg-blue-500/5">
              <span className="size-1.5 rounded-full bg-blue-500" />
              Preparing: <strong className="text-foreground">{orderStatusCounts.preparing}</strong>
            </Badge>
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 font-medium border-purple-500/30 bg-purple-500/5">
              <span className="size-1.5 rounded-full bg-purple-500" />
              Ready: <strong className="text-foreground">{orderStatusCounts.ready}</strong>
            </Badge>
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 font-medium border-teal-500/30 bg-teal-500/5">
              <span className="size-1.5 rounded-full bg-teal-500" />
              Served: <strong className="text-foreground">{orderStatusCounts.served}</strong>
            </Badge>
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 font-medium border-emerald-500/30 bg-emerald-500/5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Completed: <strong className="text-foreground">{orderStatusCounts.completed}</strong>
            </Badge>
            {orderStatusCounts.cancelled > 0 && (
              <Badge variant="outline" className="gap-1.5 py-1 px-2.5 font-medium border-destructive/30 bg-destructive/5 text-destructive">
                <span className="size-1.5 rounded-full bg-destructive" />
                Cancelled: <strong>{orderStatusCounts.cancelled}</strong>
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Left Column (Live Orders & Financial Breakdown) | Right Column (Performance & Attention Center) */}
      <div className="grid gap-5 lg:grid-cols-3 w-full min-w-0">
        {/* Left Column (2 Cols Wide on Large screens) */}
        <div className="lg:col-span-2 space-y-5 min-w-0">
          {/* Live Kitchen & POS Orders Feed */}
          <Card className="min-w-0 border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-5 pb-3">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Live Operations Stream
                </CardTitle>
                <CardDescription className="text-xs">
                  Active orders from customer QR codes and frontline POS registers.
                </CardDescription>
              </div>
              <Link
                href="/admin/orders"
                className="text-amber-500 hover:text-amber-400 font-semibold text-xs inline-flex items-center gap-0.5 transition-colors"
              >
                View All Orders →
              </Link>

            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="text-xs font-semibold pl-4 sm:pl-5">Order #</TableHead>
                      <TableHead className="text-xs font-semibold px-3">Origin</TableHead>
                      <TableHead className="text-xs font-semibold px-3">Location</TableHead>
                      <TableHead className="text-xs font-semibold px-3">Time</TableHead>
                      <TableHead className="text-xs font-semibold px-3">Total</TableHead>
                      <TableHead className="text-right text-xs font-semibold pr-4 sm:pr-5">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground text-xs">
                          No active orders recorded yet today.
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="py-3 pl-4 sm:pl-5 font-mono text-xs font-bold text-foreground">
                            {order.orderNumber}
                          </TableCell>
                          <TableCell className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                              {order.source === "QR" ? (
                                <>
                                  <Smartphone className="size-3 text-violet-500" />
                                  QR Code
                                </>
                              ) : (
                                <>
                                  <Store className="size-3 text-amber-500" />
                                  Counter POS
                                </>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-xs text-muted-foreground">
                            {order.tableName}
                          </TableCell>
                          <TableCell className="py-3 px-3 text-xs text-muted-foreground font-mono">
                            {order.time}
                          </TableCell>
                          <TableCell className="py-3 px-3 text-xs font-semibold text-foreground">
                            {order.total}
                          </TableCell>
                          <TableCell className="py-3 text-right pr-4 sm:pr-5">
                            <span
                              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                statusBadgeStyles[order.status.toLowerCase()] || "border-border text-muted-foreground"
                              }`}
                            >
                              {order.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>

                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Payment Method (Financial KPI Breakdown) */}
          <Card className="min-w-0 border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-5 pb-3">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Revenue by Settlement Channel
                </CardTitle>
                <CardDescription className="text-xs">
                  Financial distribution across Cash, GCash, Maya, and Payment Cards.
                </CardDescription>
              </div>
              <Link
                href="/admin/reports"
                className="text-amber-500 hover:text-amber-400 font-semibold text-xs inline-flex items-center gap-0.5 transition-colors"
              >
                Analytics Report →
              </Link>

            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              {paymentMethods.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No settled payments recorded yet.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {paymentMethods.map((pm) => (
                    <div key={pm.method} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <CreditCard className="size-3.5 text-muted-foreground" />
                          {pm.label}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground text-[11px]">
                            {pm.count} payment{pm.count > 1 ? "s" : ""}
                          </span>
                          <span className="font-mono font-bold text-foreground">
                            ₱{pm.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                          </span>
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold">
                            {pm.percentage}%
                          </Badge>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pm.method === "gcash"
                              ? "bg-blue-500"
                              : pm.method === "maya"
                              ? "bg-emerald-500"
                              : pm.method === "cash"
                              ? "bg-amber-500"
                              : "bg-purple-500"
                          }`}
                          style={{ width: `${Math.max(pm.percentage, 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Performance & Operations Control) */}
        <div className="space-y-5 min-w-0">
          {/* Top Selling Menu Items */}
          <Card className="min-w-0 border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-5 pb-3">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Top Performing Dishes
                </CardTitle>
                <CardDescription className="text-xs">
                  Highest volume and revenue drivers.
                </CardDescription>
              </div>
              <Link
                href="/admin/menu"
                className="text-amber-500 hover:text-amber-400 font-semibold text-xs inline-flex items-center gap-0.5 transition-colors"
              >
                Menu Items →
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="text-xs font-semibold pl-4 sm:pl-5">Rank / Dish</TableHead>
                    <TableHead className="text-right text-xs font-semibold pr-4 sm:pr-5">Sold & Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSellingItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="py-8 text-center text-xs text-muted-foreground">
                        No dish order data yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    topSellingItems.map((item, index) => (
                      <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="py-3 pl-4 sm:pl-5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                index === 0
                                  ? "bg-amber-500 text-neutral-950"
                                  : index === 1
                                  ? "bg-slate-300 text-neutral-900"
                                  : index === 2
                                  ? "bg-amber-700/20 text-amber-600 dark:text-amber-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {index + 1}
                            </span>
                            <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                              {item.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-right pr-4 sm:pr-5">
                          <div className="text-xs font-bold font-mono text-foreground">
                            {item.formattedRevenue}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {item.quantitySold} portion{item.quantitySold > 1 ? "s" : ""}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Today's Table Reservations */}
          <Card className="min-w-0 border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-5 pb-3">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Today&apos;s Reservations
                </CardTitle>
                <CardDescription className="text-xs">
                  Upcoming bookings & party seatings.
                </CardDescription>
              </div>
              <Link
                href="/admin/reservations"
                className="text-amber-500 hover:text-amber-400 font-semibold text-xs inline-flex items-center gap-0.5 transition-colors"
              >
                Schedule →
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="text-xs font-semibold pl-4 sm:pl-5">Guest & Party</TableHead>
                    <TableHead className="text-right text-xs font-semibold pr-4 sm:pr-5">Time & Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayReservations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="py-8 text-center text-xs text-muted-foreground">
                        No upcoming reservations scheduled.
                      </TableCell>
                    </TableRow>
                  ) : (
                    todayReservations.map((res) => (
                      <TableRow key={res.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="py-3 pl-4 sm:pl-5">
                          <p className="text-xs font-semibold text-foreground leading-tight">{res.customerName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {res.numberOfGuests} guests • {res.tableName}
                          </p>
                        </TableCell>
                        <TableCell className="py-3 text-right pr-4 sm:pr-5">
                          <p className="text-xs font-mono font-medium text-foreground flex items-center justify-end gap-1">
                            <Clock className="size-3 text-muted-foreground" />
                            {res.reservationTime}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-md border px-1.5 py-0.2 text-[9px] font-semibold uppercase mt-0.5 ${
                              statusBadgeStyles[res.status.toLowerCase()] || "border-border text-muted-foreground"
                            }`}
                          >
                            {res.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
