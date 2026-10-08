"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export interface NavMainItem {
  title: string
  url: string
  icon?: React.ReactNode
  isActive?: boolean
  items?: {
    title: string
    url: string
    items?: {
      title: string
      url: string
    }[]
  }[]
}

function NavSingleItem({
  item,
  isActive,
}: {
  item: NavMainItem
  isActive: boolean
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
        className="font-medium tracking-tight text-[13px] h-10 px-3 transition-colors"
      >
        <Link href={item.url}>
          {item.icon}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function NavCollapsibleItem({
  item,
  pathname,
}: {
  item: NavMainItem
  pathname: string
}) {
  const isParentActive =
    item.items?.some((sub) => {
      if (sub.items) {
        return sub.items.some((child) => pathname.startsWith(child.url))
      }
      return pathname.startsWith(sub.url)
    }) ?? false

  const [open, setOpen] = React.useState(isParentActive)

  React.useEffect(() => {
    if (isParentActive) {
      setOpen(true)
    }
  }, [isParentActive])

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className="group font-medium tracking-tight text-[13px] h-10 px-3"
            isActive={isParentActive}
            tooltip={item.title}
          >
            {item.icon}
            <span>{item.title}</span>
            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((subItem) => {
              const subActive =
                subItem.url === item.url
                  ? pathname === item.url
                  : pathname === subItem.url || pathname.startsWith(subItem.url + "/")

              return (
                <SidebarMenuSubItem key={subItem.title}>
                  {subItem.items ? (
                    <Collapsible
                      className="group"
                      defaultOpen={subItem.items.some((child) =>
                        pathname.startsWith(child.url)
                      )}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="group h-8 min-h-8 pl-6 text-xs">
                          <span>{subItem.title}</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {subItem.items.map((child) => (
                            <SidebarMenuButton
                              key={child.title}
                              asChild
                              isActive={
                                pathname === child.url ||
                                pathname.startsWith(child.url + "/")
                              }
                              className="h-8 min-h-8 pl-6 text-xs"
                            >
                              <Link href={child.url}>{child.title}</Link>
                            </SidebarMenuButton>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      isActive={subActive}
                      className="h-8 min-h-8 pl-6 text-xs"
                    >
                      <Link href={subItem.url}>{subItem.title}</Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function NavMain({ items }: { items: NavMainItem[] }) {
  const pathname = usePathname()

  const isActive = (url: string) => {
    if (url === "/dashboard/analytics" || url === "/") {
      return pathname === url
    }
    return pathname === url || pathname.startsWith(url + "/")
  }

  return (
    <SidebarMenu className="px-3 py-2 space-y-1">
      {items.map((item) =>
        item.items && item.items.length > 0 ? (
          <NavCollapsibleItem
            key={item.title}
            item={item}
            pathname={pathname}
          />
        ) : (
          <NavSingleItem
            key={item.title}
            item={item}
            isActive={isActive(item.url)}
          />
        )
      )}
    </SidebarMenu>
  )
}