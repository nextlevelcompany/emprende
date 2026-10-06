"use client"

import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  BookOpen,
  ChartSine,
  UserCircle,
  CodeAlt,
  WaterDropHalf,
  File,
  Tachometer,
  Grid,
  BuildingHouse,
  MessageCircleQuestionMark,
  Lock,
  PieChartAlt2,
  Send,
  Cog,
  Bug,
  Frame,
  LocationBlank,
  HomeAlt,
  ShoppingBag,
  CircleThreeQuarter
} from "@boxicons/react"

// nav menues
const data = {
  user: {
    name: "Alex Martin",
    email: "alex@example.com",
    avatar: "https://untitledui.com/images/avatars/madeleine-pitts",
  },
  navMain: [
    {
      title: "Caja Comunal",
      url: "#",
      icon: <BuildingHouse />,
      isActive: true,
      items: [
        {
          title: "Padrón de Socios",
          url: "/admin/socios",
        },
        {
          title: "Periodos Contables",
          url: "/admin/periodos",
        },
        {
          title: "Préstamos y Créditos",
          url: "/admin/prestamos",
        },
        {
          title: "Distribución de Utilidades",
          url: "/admin/utilidades",
        },
        {
          title: "Reportes de Asamblea",
          url: "/admin/reportes",
        },
        {
          title: "Pista de Auditoría",
          url: "/admin/auditoria",
        },
      ],
    },
    {
      title: "Dashboard",
      url: "#",
      icon: (
        <HomeAlt
        />
      ),
      isActive: false,
      items: [
        {
          title: "Analytics",
          url: "/dashboard/analytics",
        },
        {
          title: "eCommerce",
          url: "/dashboard/eCommerce",
        },
      ],
    },
    {
      title: "eCommerce",
      url: "#",
      icon: (
        <ShoppingBag
        />
      ),
      items: [
        {
          title: "Product List",
          url: "/eCommerce/product-list",
        },
        {
          title: "Product Grid",
          url: "/eCommerce/product-grid",
        },
        {
          title: "Add Product",
          url: "/eCommerce/add-product",
        },
        {
          title: "Categories",
          url: "/eCommerce/categories",
        },
        {
          title: "Order List",
          url: "/eCommerce/order-list",
        },
        {
          title: "Order Details",
          url: "/eCommerce/order-details",
        },
        {
          title: "Customer List",
          url: "/eCommerce/customer-list",
        },
        {
          title: "Customer Details",
          url: "/eCommerce/customer-details",
        },
        {
          title: "Invoice",
          url: "/eCommerce/invoice",
        },
        
      ],
    },
    {
      title: "Widgets",
      url: "#",
      icon: (
        <Send
        />
      ),
      items: [
        {
          title: "Data Widgets",
          url: "/widgets/data",
        },
        {
          title: "Statistics Widgets",
          url: "/widgets/statistics",
        },
      ],
    },
    {
      title: "Applications",
      url: "#",
      icon: (
        <Grid
        />
      ),
      items: [
        {
          title: "Chatbox",
          url: "/applications/chatbox",
        },
         {
          title: "Calendar",
          url: "/applications/calendar",
        },
         {
          title: "File Manager",
          url: "/applications/file-manager",
        },
         {
          title: "Invoice Card",
          url: "/applications/invoice",
        },
      ],
    },
    {
      title: "UI Components",
      url: "#",
      icon: (
        <Cog
        />
      ),
      items: [
        {
          title: "Alerts",
          url: "/ui-components/alerts",
        },
        {
          title: "Accordion",
          url: "/ui-components/accordion",
        },
        {
          title: "Sooner",
          url: "/ui-components/sooner",
        },
        {
          title: "Badges",
          url: "/ui-components/badges",
        },
        {
          title: "Buttons",
          url: "/ui-components/buttons",
        },
        {
          title: "Cards",
          url: "/ui-components/cards",
        },
        {
          title: "List Groups",
          url: "/ui-components/list-groups",
        },
        {
          title: "Media Object",
          url: "/ui-components/media-object",
        },
        {
          title: "Navbars",
          url: "/ui-components/navbars",
        },
        {
          title: "Progress",
          url: "/ui-components/progressbars",
        },
        {
          title: "Spinners",
          url: "/ui-components/spinners",
        },
      ],
    },
    {
      title: "Forms",
      url: "#",
      icon: (
        <File
        />
      ),
      items: [
        {
          title: "Basic Inputs",
          url: "/forms/basic-inputs",
        },
        {
          title: "Input Groups",
          url: "/forms/input-groups",
        },
        {
          title: "Radio & Checkboxes",
          url: "/forms/checkboxes-radios",
        },
        {
          title: "Form Layouts",
          url: "/forms/form-layouts",
        },
        {
          title: "Form Wizard",
          url: "/forms/form-wizard",
        },
        {
          title: "Text Editor",
          url: "/forms/text-editor",
        },
        {
          title: "File Upload",
          url: "/forms/file-upload",
        },
        {
          title: "Date Pickers",
          url: "/forms/date-pickers",
        },
        {
          title: "Select",
          url: "/forms/select",
        },
        {
          title: "Form Repeat",
          url: "/forms/form-repeat",
        },
      ],
    },
    {
      title: "Tables",
      url: "#",
      icon: (<Grid />),
      items: [
        { title: "Basic Tables", url: "/tables/basic-tables" },
        { title: "Data Tables", url: "/tables/data-tables" },
        { title: "Advanced Tables", url: "/tables/advance-tables" },
      ],
    },
    {
      title: "Icons",
      url: "#",
      icon: (<WaterDropHalf />),
      items: [
        { title: "Boxicons", url: "/icons/boxicons" },
        { title: "Bootstrap", url: "/icons/bootstrap" },
        { title: "Lucide", url: "/icons/lucide" },
      ],
    },
    {
      title: "Pricing",
      url: "/pricing-tables",
      icon: (< LocationBlank/>),
    },
    {
      title: "Authentication",
      url: "#",
      icon: (<Lock />),
      items: [
        {
          title: "Basic",
          url: "#",
          items: [
            { title: "Login", url: "/auth/basic/login" },
            { title: "Register", url: "/auth/basic/register" },
            { title: "Verify Email", url: "/auth/basic/verify-email" },
            { title: "Forgot Password", url: "/auth/basic/forgot-password" },
            { title: "New Password", url: "/auth/basic/reset-password" },
            { title: "Reset Success", url: "/auth/basic/password-reset-success" },
          ],
        },
        {
          title: "Cover",
          url: "#",
          items: [
            { title: "Login", url: "/auth/cover/login" },
            { title: "Register", url: "/auth/cover/register" },
            { title: "Verify Email", url: "/auth/cover/verify-email" },
            { title: "Forgot Password", url: "/auth/cover/forgot-password" },
            { title: "New Password", url: "/auth/cover/reset-password" },
            { title: "Reset Success", url: "/auth/cover/password-reset-success" },
          ],
        },
      ],
    },
    {
      title: "Accounts",
      url: "#",
      icon: (<Bug />),
      items: [
        { title: "Profile", url: "/account/profile" },
        { title: "Edit Profile", url: "/account/edit-profile" },
        { title: "Password Setting", url: "/account/password-setting" },
        { title: "Noitifications", url: "/account/notifications" },
      ],
    },
    {
      title: "Charts",
      url: "#",
      icon: (<ChartSine />),
      items: [
        { title: "ReCharts", url: "/charts/recharts" },
        { title: "Apex Charts", url: "/charts/apexcharts" },
      ],
    },
    {
      title: "Documentation",
      url: "/docs",
      icon: (<Tachometer />),
    },
    {
      title: "FAQ",
      url: "/faq",
      icon: (<BookOpen />),
    },
    {
      title: "Error Pages",
      url: "#",
      icon: (<PieChartAlt2 />),
      items: [
        { title: "404 Not Found", url: "/error/error-404" },
        { title: "500 Server Error", url: "/error/error-500" },
        { title: "coming soon", url: "/error/coming-soon" },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: (
        <UserCircle
        />
      ),
    },
    {
      title: "Feedback",
      url: "#",
      icon: (
        <BuildingHouse
        />
      ),
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: (
        <CodeAlt
        />
      ),
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: (
        <MessageCircleQuestionMark
        />
      ),
    },
    {
      name: "Travel",
      url: "#",
      icon: (
        <Frame
        />
      ),
    },
  ],
}

// This is the sidebar component used in the app layout.
type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  onHoverChange?: (value: boolean) => void
}

// The sidebar component used in the app layout. It receives an `onHoverChange` prop to notify the parent layout when the sidebar is hovered or not.
export function AppSidebar({ onHoverChange, ...props }: AppSidebarProps) {
  return (
     <div
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
    <Sidebar collapsible="icon" {...props} className="shadow-lg z-50 overflow-hidden">
      <SidebarHeader className="h-16 justify-center px-3 border-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="p-2">
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center mx-auto rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <CircleThreeQuarter className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Syndron UI</span>
                  <span className="truncate text-xs">Next.js Admin</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
        <SidebarContent className="overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex min-h-full flex-col">
              <NavMain items={data.navMain} />

              <NavSecondary
                items={data.navSecondary}
                className="mt-auto px-3 pb-3"
              />
            </div>
          </ScrollArea>
        </SidebarContent>
    </Sidebar>
    </div>
  )
}
