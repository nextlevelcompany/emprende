import Image from "next/image"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCardIcon, LogOutIcon, SettingsIcon, UserIcon, EllipsisVertical} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

const products = [
  {
    name: "MacBook Pro",
    sku: "#PRD-1024",
    price: "$2,199.00",
    quantity: 12,
    image: "/products/15.png",
  },
  {
    name: "AirPods Max",
    sku: "#PRD-2048",
    price: "$549.00",
    quantity: 28,
    image: "/products/02.png",
  },
  {
    name: "iPhone 16",
    sku: "#PRD-3098",
    price: "$1,299.00",
    quantity: 35,
    image: "/products/13.png",
  },
  {
    name: "Gaming Chair",
    sku: "#PRD-4120",
    price: "$389.00",
    quantity: 16,
    image: "/products/12.png",
  },
  {
    name: "Smart TV",
    sku: "#PRD-5588",
    price: "$899.99",
    quantity: 9,
    image: "/products/11.png",
  },
  {
    name: "Mechanical Keyboard",
    sku: "#PRD-6231",
    price: "$149.00",
    quantity: 42,
    image: "/products/10.png",
  },
  {
    name: "Gaming Mouse",
    sku: "#PRD-7345",
    price: "$89.99",
    quantity: 50,
    image: "/products/09.png",
  },
  {
    name: "4K Monitor",
    sku: "#PRD-8459",
    price: "$479.00",
    quantity: 14,
    image: "/products/07.png",
  },
  {
    name: "Bluetooth Speaker",
    sku: "#PRD-9560",
    price: "$129.00",
    quantity: 24,
    image: "/products/06.png",
  },
]

export default function PopularProductsCard() {
  return (
    <Card>
      <CardContent className="p-6">
       <div className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg mb-0">Popular Products</CardTitle>
          <CardDescription>
            Total 10.4k Visitors
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
      </CardContent>
      <ScrollArea className="h-[470px] pb-6">
      <div className="space-y-5 px-6">
        {products.map((product, index) => (
          <div
            key={index}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Image unoptimized height={480} width={640}
                src={product.image}
                alt={product.name}
                className="h-12 w-12 rounded-lg object-cover p-1 bg-muted/70"
              />

              <div>
                <p className="text-sm font-medium leading-none">
                  {product.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Item: {product.sku}
                </p>
              </div>
            </div>

            <span className="text-sm font-medium">
              {product.price}
            </span>
           </div>
          ))}
      </div>
      </ScrollArea>
    </Card>
  )
}
