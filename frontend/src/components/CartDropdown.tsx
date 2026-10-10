"use client"
import Image from "next/image"
import {
  Cart,
  X,
} from "@boxicons/react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type CartItem = {
  id: number
  title: string
  quantity: number
  price: number
  image?: string
}

const cartItems: CartItem[] = [
  {
    id: 1,
    title: "Nike Sneakers",
    quantity: 1,
    price: 129,
    image: "/pulse-ui-next/products/01.png",
  },
  {
    id: 2,
    title: "Wooden Chair",
    quantity: 2,
    price: 89,
    image: "/pulse-ui-next/products/02.png",
  },
  {
    id: 3,
    title: "Modern Sofa",
    quantity: 1,
    price: 499,
    image: "/pulse-ui-next/products/03.png",
  },
  {
    id: 4,
    title: "Pink Couch",
    quantity: 1,
    price: 349,
    image: "/pulse-ui-next/products/04.png",
  },
  {
    id: 5,
    title: "Dining Table",
    quantity: 1,
    price: 259,
    image: "/pulse-ui-next/products/05.png",
  },
  {
    id: 6,
    title: "Wireless Headphones",
    quantity: 1,
    price: 199,
    image: "/pulse-ui-next/products/06.png",
  },
  {
    id: 7,
    title: "Smart Watch",
    quantity: 1,
    price: 149,
    image: "/pulse-ui-next/products/07.png",
  }

]

export function CartDropdown() {
  const cartCount = cartItems.length

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative hidden md:flex">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-full flex items-center 
            justify-center shrink-0"
          >
            <Cart className="size-5 block shrink-0" />
          </Button>

          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-none whitespace-nowrap shadow-sm border-2 border-background">
              {cartCount}
            </span>
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[350px] rounded-2xl p-0 overflow-hidden shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">
            My Cart
          </h3>

          <span className="text-sm font-medium px-3 py-1 rounded-lg bg-muted/70 text-primary">
            {cartCount} Items
          </span>
        </div>

        {/* Cart Items */}
        <ScrollArea className="h-94">
          <div className="flex flex-col">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 px-4 py-3 border-b last:border-0 transition-colors hover:bg-muted/50 cursor-pointer"
              >
                {/* Product Image */}
                <div className="h-12 w-12 shrink-0 rounded-full bg-muted/50
                    border overflow-hidden flex items-center justify-center p-1">
                    {item.image ? (
                        <Image unoptimized height={480} width={640}
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <span className="text-sm font-medium text-muted-foreground">
                            {item.title.charAt(0)}
                        </span>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold truncate">
                    {item.title}
                  </h4>

                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × ${item.price}.00
                  </p>
                </div>

                {/* Price + Remove */}
                <div className="flex items-center gap-3">
                  <span className="text-base font-medium">
                    ${item.price}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full border"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              Total
            </span>

            <span className="text-xl font-bold">
              ${total}.00
            </span>
          </div>

          <Button className="w-full h-9 text-sm rounded-xl">
            Checkout
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}