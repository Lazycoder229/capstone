// app/admin/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  PrinterIcon,
  AlertTriangle,
  Plus,
  UtensilsCrossed,
  Users,
  Tag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { fetchDashboardMetrics } from "@/app/actions/dashboard";

const metricIcons = [ShoppingBag, CreditCard, Table2, CalendarCheck, QrCode];

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  pending: "default",
  preparing: "secondary",
  ready: "outline",
  served: "outline",
  confirmed: "outline",
};

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Array<{ label: string; value: string; trend: string; icon: typeof ShoppingBag; trendUp: boolean | null }>>([]);
  const [liveOrders, setLiveOrders] = useState<Array<{ id: string; items: string; source: string; status: string }>>([]);
  const [alerts, setAlerts] = useState<Array<{ icon: typeof AlertTriangle; text: string; tone: "warning" }>>([]);

  useEffect(() => {
    fetchDashboardMetrics().then((res) => {
      if (res.success && res.data) {
        setMetrics(res.data.metrics.map((metric, index) => ({ ...metric, icon: metricIcons[index] })));
        setLiveOrders(res.data.activeOrders.map((order) => ({
          id: order.id,
          items: order.items,
          source: order.source,
          status: order.status,
        })));
        setAlerts(res.data.lowStockCount > 0 ? [{ icon: AlertTriangle, text: `${res.data.lowStockCount} low stock item(s)`, tone: "warning" }] : []);
      }
    });
  }, []);

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden pb-16 sm:pb-8">
      <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Today&apos;s overview across all channels.
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button className="w-full sm:w-auto bg-amber-500 text-neutral-950 hover:bg-amber-400 font-semibold shadow-sm h-11 sm:h-10 text-sm">
                  <Plus className="mr-2 size-4" />
                  Quick actions
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2 py-2 cursor-pointer">
                <UtensilsCrossed className="size-4" />
                Add menu item
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 py-2 cursor-pointer">
                <CalendarCheck className="size-4" />
                Add reservation
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 py-2 cursor-pointer">
                <QrCode className="size-4" />
                Generate table QR
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 py-2 cursor-pointer">
                <PrinterIcon className="size-4" />
                Test printer
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 py-2 cursor-pointer">
                <Users className="size-4" />
                Add employee
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 py-2 cursor-pointer">
                <Tag className="size-4" />
                Create promo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5 w-full min-w-0">
          {metrics.map((metric) => (
            <Card key={metric.label} className="min-w-0 border bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between p-3 pb-1 sm:p-4 sm:pb-2 space-y-0">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  {metric.label}
                </CardTitle>
                <metric.icon className="size-4 text-muted-foreground shrink-0" />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-lg sm:text-2xl font-bold tracking-tight truncate">{metric.value}</div>
                <p
                  className={`mt-0.5 text-[11px] sm:text-xs font-medium truncate ${
                    metric.trendUp === true
                      ? "text-emerald-600 dark:text-emerald-400"
                      : metric.trendUp === false
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {metric.trend}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Sections */}
        <div className="grid gap-4 lg:grid-cols-3 w-full min-w-0">
          {/* Live Orders */}
          <Card className="lg:col-span-2 min-w-0 border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg font-bold">Live orders</CardTitle>
              <Button variant="link" size="sm" className="h-auto p-0 text-amber-500 font-semibold text-xs sm:text-sm">
                View all
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:px-2 pb-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-muted-foreground pl-4 sm:pl-6">Order</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Source</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-muted-foreground pr-4 sm:pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="py-2.5 pl-4 sm:pl-6">
                        <span className="font-semibold text-xs sm:text-sm text-foreground">
                          {order.id}
                        </span>
                        <span className="text-[11px] sm:text-xs text-muted-foreground ml-1.5 font-normal">
                          • {order.items}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-muted-foreground font-medium">
                        {order.source}
                      </TableCell>
                      <TableCell className="py-2.5 text-right pr-4 sm:pr-6">
                        <Badge
                          variant={statusVariant[order.status]}
                          className="text-[10px] sm:text-xs px-2 py-0.5 font-medium"
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Selling Items */}
          <Card className="min-w-0 border bg-card shadow-xs">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg font-bold">Top selling items</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:px-2 pb-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-muted-foreground pl-4 sm:pl-6">Item</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-muted-foreground pr-4 sm:pr-6">Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveOrders.length === 0 ? <TableRow><TableCell colSpan={2} className="py-8 text-center text-muted-foreground">No live orders.</TableCell></TableRow> : liveOrders.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-2.5 pl-4 sm:pl-6 font-medium text-xs sm:text-sm text-foreground">
                        {item.id}
                      </TableCell>
                      <TableCell className="py-2.5 text-right pr-4 sm:pr-6 text-xs text-muted-foreground font-semibold">
                        {item.items}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Reservations */}
          <Card className="min-w-0 border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg font-bold">Today&apos;s reservations</CardTitle>
              <Button variant="link" size="sm" className="h-auto p-0 text-amber-500 font-semibold text-xs sm:text-sm">
                View all
              </Button>
            </CardHeader>
            <CardContent className="w-full p-0 sm:px-2 pb-2">
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-2/3 text-xs font-semibold text-muted-foreground pl-4 sm:pl-6">Guest</TableHead>
                    <TableHead className="w-1/3 text-right text-xs font-semibold text-muted-foreground pr-4 sm:pr-6">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell colSpan={2} className="py-8 text-center text-muted-foreground">No reservations recorded today.</TableCell></TableRow>
                  {/* Reservations are not included in the dashboard action contract. */}
                  {/* {reservations.map((reservation) => (
                    <TableRow key={`${reservation.guest}-${reservation.time}`}>
                      <TableCell className="py-2.5 pl-4 sm:pl-6">
                        <div className="text-xs sm:text-sm font-medium text-foreground">{reservation.guest}</div>
                        <div className="text-[11px] text-muted-foreground">{reservation.guests} guests</div>
                      </TableCell>
                      <TableCell className="py-2.5 text-right pr-4 sm:pr-6">
                        <div className="text-xs sm:text-sm font-medium text-foreground">{reservation.time}</div>
                        <Badge
                          variant={statusVariant[reservation.status]}
                          className="mt-1 text-[10px] px-2 py-0.5 font-medium capitalize"
                        >
                          {reservation.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))} */}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Section */}
        <div className="grid gap-4 sm:grid-cols-2 w-full min-w-0">
          {/* Staff on Shift */}
          <Card className="min-w-0 border bg-card shadow-xs">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg font-bold">Staff on shift</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:px-2 pb-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-muted-foreground pl-4 sm:pl-6">Staff Member</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-muted-foreground pr-4 sm:pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell colSpan={2} className="py-8 text-center text-muted-foreground">No staff shift data available.</TableCell></TableRow>
                  {/* Staff shift data is not included in the dashboard action contract. */}
                  {/* {staffOnShift.map((staff) => (
                    <TableRow key={staff.initials}>
                      <TableCell className="py-2.5 pl-4 sm:pl-6">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            {staff.initials}
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-foreground">{staff.role}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 text-right pr-4 sm:pr-6">
                        <Badge
                          variant="outline"
                          className={`text-[10px] sm:text-xs px-2 py-0.5 shrink-0 ${
                            staff.online
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                              : "border-muted text-muted-foreground"
                          }`}
                        >
                          {staff.online ? "online" : "offline"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))} */}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="min-w-0 border bg-card shadow-xs">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg font-bold">Alerts</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:px-2 pb-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-muted-foreground pl-4 sm:pl-6">Notification</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-muted-foreground pr-4 sm:pr-6">Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.length === 0 ? <TableRow><TableCell colSpan={2} className="py-8 text-center text-muted-foreground">No active alerts.</TableCell></TableRow> : alerts.map((alert) => (
                    <TableRow key={alert.text}>
                      <TableCell className="py-2.5 pl-4 sm:pl-6">
                        <div className="flex items-center gap-2">
                          <alert.icon
                            className={`size-4 shrink-0 ${
                              alert.tone === "danger"
                                ? "text-destructive"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          />
                          <span className="text-xs sm:text-sm font-medium text-foreground">{alert.text}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 text-right pr-4 sm:pr-6">
                        <Badge
                          variant={alert.tone === "danger" ? "destructive" : "secondary"}
                          className="text-[10px] sm:text-xs px-2 py-0.5 font-medium capitalize"
                        >
                          {alert.tone}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
