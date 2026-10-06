import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import {
  CircleCheckBig,
  ShieldHalf,
  OctagonX,
  CreditCardIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
  EllipsisVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const recentpayment = [
  {
    title: "Stripe Payment",
    description: "Received from Olivia Martin",
    value: "+$1,280",
    color:
      "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    valueColor: "text-green-600",
    icon: <CircleCheckBig className="h-5 w-5" />,
  },
  {
    title: "Subscription Renewal",
    description: "Monthly Pro Plan",
    value: "+$320",
    color:
      "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    valueColor: "text-blue-600",
    icon: <CreditCardIcon className="h-5 w-5" />,
  },
  {
    title: "Refund Processed",
    description: "Order cancellation refund",
    value: "-$89",
    color:
      "bg-red-100 text-red-500 dark:bg-red-500/20 dark:text-red-400",
    valueColor: "text-red-500",
    icon: <OctagonX className="h-5 w-5" />,
  },
  {
    title: "Pending Transfer",
    description: "Awaiting bank approval",
    value: "$540",
    color:
      "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400",
    valueColor: "text-yellow-600",
    icon: <ShieldHalf className="h-5 w-5" />,
  },
  {
  title: "PayPal Deposit",
  description: "Payment received from client",
  value: "+$760",
  color:
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
  valueColor: "text-indigo-600",
  icon: <CreditCardIcon className="h-5 w-5" />,
},
{
  title: "Wire Transfer",
  description: "International bank transfer",
  value: "+$2,450",
  color:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  valueColor: "text-emerald-600",
  icon: <CircleCheckBig className="h-5 w-5" />,
},
{
  title: "Invoice Payment",
  description: "Invoice #2048 completed",
  value: "+$980",
  color:
    "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
  valueColor: "text-cyan-600",
  icon: <ShieldHalf className="h-5 w-5" />,
},
{
  title: "Crypto Withdrawal",
  description: "USDT transfer completed",
  value: "-$1,120",
  color:
    "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
  valueColor: "text-orange-600",
  icon: <OctagonX className="h-5 w-5" />,
},
]

export default function RecentPaymentCard() {
  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-row items-center justify-between mb-6">
        <div>
          <CardTitle className="text-lg mb-0">Recent Transactions</CardTitle>
          <CardDescription>
            Latest payment activities
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full [&_svg]:size-5">
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <UserIcon />
              View detailed report
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCardIcon />
              Download report
            </DropdownMenuItem>
            <DropdownMenuItem>
              <SettingsIcon />
              Export as CSV / PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOutIcon />
             Refresh data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
        <div className="mt-6 space-y-5">
          {recentpayment.map((payment, index) => (
            <div
              key={index}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">

                {/* Icon */}
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${payment.color}`}
                >
                  {payment.icon}
                </div>

                {/* Content */}
                <div>
                  <p className="text-sm font-medium">
                    {payment.title}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {payment.description}
                  </p>
                </div>
              </div>

              {/* Value */}
              <span
                className={`text-sm font-medium ${payment.valueColor}`}
              >
                {payment.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
