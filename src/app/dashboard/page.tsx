"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

const stats = [
  {
    title: "Total Users",
    value: "2,543",
    change: "+12%",
    changeType: "increase" as const,
    icon: Users,
  },
  {
    title: "Orders",
    value: "1,423",
    change: "+8%",
    changeType: "increase" as const,
    icon: ShoppingCart,
  },
  {
    title: "Revenue",
    value: "$43,210",
    change: "+15%",
    changeType: "increase" as const,
    icon: TrendingUp,
  },
  {
    title: "Active Sessions",
    value: "573",
    change: "-3%",
    changeType: "decrease" as const,
    icon: Activity,
  },
];

const recentActivities = [
  {
    id: 1,
    user: "John Doe",
    action: "Created new order",
    time: "2 minutes ago",
  },
  {
    id: 2,
    user: "Jane Smith",
    action: "Updated profile",
    time: "5 minutes ago",
  },
  {
    id: 3,
    user: "Mike Johnson",
    action: "Completed payment",
    time: "10 minutes ago",
  },
  {
    id: 4,
    user: "Sarah Wilson",
    action: "Joined the platform",
    time: "15 minutes ago",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="flex items-center text-sm mt-1">
                  {stat.changeType === "increase" ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span
                    className={
                      stat.changeType === "increase"
                        ? "text-green-600 ml-1"
                        : "text-red-600 ml-1"
                    }
                  >
                    {stat.change}
                  </span>
                  <span className="text-gray-500 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions from your users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{activity.user}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <ShoppingCart className="mr-2 h-4 w-4" />
              View Orders
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              Analytics Report
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Activity className="mr-2 h-4 w-4" />
              System Status
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
          <CardDescription>Revenue and user growth over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Chart component would go here</p>
              <p className="text-sm text-gray-500">Connect your analytics library of choice</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 