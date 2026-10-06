"use client"

import React from "react"
import TrafficReferralsCard from "./TrafficReferralsCard"
import TottalOrdersCard from "./TotalOrdersCard"
import TotalRevenueCard from "./TotalRevenueCard"
import VisitorsCard from "./VisitorsCard"
import SalesOverviewCard from "./SalesOverviewCard"
import RecentOrdersCard from "./RecentPaymentCard"
import SalesByCountriesCard from "./SalesByCountriesCard"
import OrderStatus from "./OrderStatus"
import RecentOrdersTable from "./RecentOrdersTable"
import PopularProductsCard from "./PopularProductsCard"

export default function EcommerceDashboard() {
  return (
    <div className="ecommerce-dashboard">

      {/* Top Stats */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3 mb-6">

        <TottalOrdersCard />

        <TotalRevenueCard />
        <VisitorsCard />
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-12 gap-6">

        <div className="col-span-12 xl:col-span-8">
          <SalesOverviewCard />
        </div>
       
        <div className="col-span-12 xl:col-span-4">
          <OrderStatus />
        </div>

        <div className="col-span-12 lg:col-span-6 xl:col-span-4">
          <RecentOrdersCard />
        </div>

        <div className="col-span-12 lg:col-span-6 xl:col-span-4">
          <SalesByCountriesCard />
        </div>

        <div className="col-span-12 lg:col-span-12 xl:col-span-4">
          <TrafficReferralsCard />
        </div>

        <div className="col-span-12 xl:col-span-8">
          <RecentOrdersTable />
        </div>

        <div className="col-span-12 xl:col-span-4">
          <PopularProductsCard />
        </div>

      </div>

    </div>
  )
}