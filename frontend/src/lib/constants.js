import {
  LayoutDashboard,
  BedDouble,
  Utensils,
  Users,
  Shield,
} from "lucide-react";

export const NAV_ITEMS = {
  HospitalAdmin: [
    {
      title: "Dashboard",
      url: "/hospital-admin",
      icon: LayoutDashboard,
    },
    {
      title: "Wards",
      url: "/hospital-admin/wards",
      icon: BedDouble,
    },
    {
      title: "Diet Plans",
      url: "/hospital-admin/diet-plans",
      icon: Utensils,
    },
    {
      title: "Patients",
      url: "/hospital-admin/patients",
      icon: Users,
    },
  ],

  SystemAdmin: [
    {
      title: "System Dashboard",
      url: "/system-admin",
      icon: LayoutDashboard,
    },
    {
      title: "Users",
      url: "/system-admin/users",
      icon: Shield,
    },
  ],
};