import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  CreditCardIcon,
  SettingsIcon,
  UserIcon,
  EllipsisVertical,
  Globe,
  Mail,
  Radio,
  Search,
  Megaphone,
  Star,
  Wallet,
  TrendingUp,
  LogOutIcon
} from "lucide-react"

const trafficReferrals = [
  {
    title: "Direct Source",
    description: "Direct link click",
    value: "1.2k",
    badge: "+4.2%",
    badgeColor:
      "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    icon: <Globe className="h-5 w-5" />,
  },
  {
    title: "Social Network",
    description: "Social Channels",
    value: "31.5k",
    badge: "+8.2%",
    badgeColor:
      "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    icon: <Radio className="h-5 w-5" />,
  },
  {
    title: "Email Newsletter",
    description: "Mail Campaigns",
    value: "893",
    badge: "+2.4%",
    badgeColor:
      "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    icon: <Mail className="h-5 w-5" />,
  },
  {
    title: "Referrals",
    description: "Impact Visits",
    value: "342",
    badge: "-0.4%",
    badgeColor:
      "bg-red-100 text-red-500 dark:bg-red-500/20 dark:text-red-400",
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    title: "ADVT",
    description: "Google ADVT",
    value: "2.15k",
    badge: "+9.1%",
    badgeColor:
      "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    icon: <Megaphone className="h-5 w-5" />,
  },
  {
    title: "Other",
    description: "Many Sources",
    value: "12.5k",
    badge: "+6.2%",
    badgeColor:
      "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    icon: <Star className="h-5 w-5" />,
  },
  {
    title: "Organic Search",
    description: "Google Search",
    value: "8.9k",
    badge: "+5.1%",
    badgeColor:
      "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    icon: <Search className="h-5 w-5" />,
  },
  {
    title: "Paid Search",
    description: "Google Ads",
    value: "1.8k",
    badge: "+3.7%",
    badgeColor:
      "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    icon: <Wallet className="h-5 w-5" />,
  },
]

export default function TrafficReferralsCard() {
  return (
    <Card>
      <CardContent className="p-6">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <CardTitle className="mb-0 text-lg">
              Traffic Referrals
            </CardTitle>

            <CardDescription>
              38.4k Visitors
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full [&_svg]:size-5"
              >
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

        {/* Referral List */}
        <div className="space-y-5">
          {trafficReferrals.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between"
            >
              
              {/* Left */}
              <div className="flex items-center gap-4">
                
                {/* Icon */}
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"
                >
                  {item.icon}
                </div>

                {/* Content */}
                <div>
                  <p className="text-base font-medium text-sm">
                    {item.title}
                  </p>

                  <p className="text-sm text-muted-foreground text-xs">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-4">
                
                <span className="min-w-[60px] text-right text-sm font-medium text-muted-foreground">
                  {item.value}
                </span>

                <span
                  className={`rounded-md px-2 py-1 text-xs font-medium ${item.badgeColor}`}
                >
                  {item.badge}
                </span>

              </div>
            </div>
          ))}
        </div>

      </CardContent>
    </Card>
  )
}