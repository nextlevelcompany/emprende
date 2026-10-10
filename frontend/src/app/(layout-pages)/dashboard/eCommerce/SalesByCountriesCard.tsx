import Image from "next/image"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { CreditCardIcon, LogOutIcon, SettingsIcon, UserIcon, EllipsisVertical, ChevronUp, ChevronDown  } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const salesByCountry = [
  {
    country: "United States",
    sales: "$12,340k",
    change: "18.6%",
    trend: "up",
    flag: "https://flagcdn.com/w40/us.png",
  },
  {
    country: "Brazil",
    sales: "$3,210k",
    change: "7.9%",
    trend: "up",
    flag: "https://flagcdn.com/w40/br.png",
  },
  {
    country: "India",
    sales: "$1,275k",
    change: "15.3%",
    trend: "up",
    flag: "https://flagcdn.com/w40/in.png",
  },
  {
    country: "Australia",
    sales: "$980k",
    change: "3.8%",
    trend: "down",
    flag: "https://flagcdn.com/w40/au.png",
  },
  {
    country: "France",
    sales: "$1,145k",
    change: "11.2%",
    trend: "up",
    flag: "https://flagcdn.com/w40/fr.png",
  },
  {
    country: "China",
    sales: "$5,890k",
    change: "6.4%",
    trend: "down",
    flag: "https://flagcdn.com/w40/cn.png",
  },
  {
    country: "Germany",
    sales: "$2,675k",
    change: "9.7%",
    trend: "up",
    flag: "https://flagcdn.com/w40/de.png",
  },
  {
    country: "United Kingdom",
    sales: "$2,430k",
    change: "12.4%",
    trend: "up",
    flag: "https://flagcdn.com/w40/gb.png",
  }
]

export default function SalesByCountriesCard() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-row items-center justify-between mb-6">
          <div>
            <CardTitle className="text-lg mb-0">Sales by Countries</CardTitle>
            <CardDescription>
              Monthly sales overview
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
       <div className="space-y-5">
        {salesByCountry.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between"
          >
            {/* Flag + Info */}
            <div className="flex items-center gap-3">
              <Image unoptimized height={480} width={640}
                src={item.flag}
                alt={item.country}
                className="h-9 w-9 rounded-full object-cover border"
              />
              <div>
                <p className="font-medium text-sm">
                  {item.sales}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.country}
                </p>
              </div>
            </div>
            {/* Badge */}
            {item.trend === "up" ? (
              <span
                className="
                  inline-flex items-center gap-1 text-emerald-700 text-sm font-medium
                "
              >
                <ChevronUp className="h-4 w-4" />
                {item.change}
              </span>
            ) : (
              <span
                className="
                  inline-flex items-center gap-1 text-rose-500
                   text-sm font-medium
                "
              >
                <ChevronDown className="h-4 w-4" />
                {item.change}
              </span>
            )}

          </div>
        ))}
        </div>
      </CardContent>
    </Card>
  )
}
