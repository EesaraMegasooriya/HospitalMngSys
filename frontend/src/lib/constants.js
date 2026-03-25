import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Users,
  Building2,
  Utensils,
  Calculator,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Receipt,
  ChefHat,
  Truck,
  AlertTriangle,
  Settings,
  History,
  Database,
  Bell,
  Scale,
  Package,
  ListTree,
  CalendarDays,
  BookOpen,
  CheckSquare,
} from "lucide-react";

export const ROLE_LABELS = {
  SYSTEM_ADMIN: "System Admin",
  HOSPITAL_ADMIN: "Hospital Admin",
  DIET_CLERK: "Diet Clerk",
  SUBJECT_CLERK: "Subject Clerk",
  ACCOUNTANT: "Accountant",
  KITCHEN: "Kitchen Staff",
};

export const ROLE_BADGE_COLORS = {
  SYSTEM_ADMIN: "bg-badge-admin",
  HOSPITAL_ADMIN: "bg-badge-hospital",
  DIET_CLERK: "bg-badge-diet",
  SUBJECT_CLERK: "bg-badge-subject",
  ACCOUNTANT: "bg-badge-accountant",
  KITCHEN: "bg-badge-kitchen",
};

export const MOCK_USERS = [
  { id: "1", name: "Kamal Perera", role: "SYSTEM_ADMIN", username: "admin" },
  { id: "2", name: "Nimal Silva", role: "HOSPITAL_ADMIN", username: "hadmin" },
  { id: "3", name: "Sita Fernando", role: "DIET_CLERK", username: "diet" },
  { id: "4", name: "Ruwan Jayawardena", role: "SUBJECT_CLERK", username: "subject" },
  { id: "5", name: "Kumari Bandara", role: "ACCOUNTANT", username: "accountant" },
  { id: "6", name: "Sunil Rathnayake", role: "KITCHEN", username: "kitchen" },
];

export const NAV_ITEMS = {
  DIET_CLERK: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Census Entry", url: "/census", icon: ClipboardList },
    { title: "Census Submissions", url: "/census/submissions", icon: FileText },
  ],

  SUBJECT_CLERK: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Calculations", url: "/calculations", icon: Calculator },
    { title: "Calculation Results", url: "/calculations/results", icon: FileText },
    { title: "Orders", url: "/orders", icon: ShoppingCart },
    { title: "Order Details", url: "/orders/details", icon: FileText },
  ],

  ACCOUNTANT: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Account Price Management", url: "/accountant/prices", icon: DollarSign },
    { title: "Approvals", url: "/approvals", icon: CheckSquare },
    { title: "Approval Details", url: "/approvals/details", icon: FileText },
    { title: "Invoices", url: "/invoices", icon: Receipt },
    { title: "Invoice Details", url: "/invoices/details", icon: FileText },
  ],

  SYSTEM_ADMIN: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "System Users", url: "/system/users", icon: Users },
  ],

  HOSPITAL_ADMIN: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Admin Daily Cycle", url: "/admin/daily-cycle", icon: CalendarDays },
    { title: "Admin Diet Cycle", url: "/admin/diet-cycle", icon: ListTree },
    { title: "Admin Diet Type", url: "/admin/diet-types", icon: Utensils },
    { title: "Admin Items", url: "/admin/items", icon: Package },
    { title: "Admin Notification", url: "/admin/notifications", icon: Bell },
    { title: "Admin Recipes", url: "/admin/recipes", icon: BookOpen },
    { title: "Admin Wards", url: "/admin/wards", icon: Building2 },
  ],

  KITCHEN: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Cook Sheet", url: "/kitchen", icon: ChefHat },
    { title: "Delivery Receiving", url: "/kitchen/receiving", icon: Truck },
    { title: "Issue Reports", url: "/kitchen/reports", icon: AlertTriangle },
  ],
};

export const DASHBOARD_CARDS = {
  DIET_CLERK: [
    {
      title: "Today's Census Entry",
      description: "Enter patient meal counts for your assigned wards",
      icon: ClipboardList,
      url: "/census",
      color: "text-primary",
    },
    {
      title: "My Submissions",
      description: "View and track your submitted census data",
      icon: FileText,
      url: "/census/submissions",
      color: "text-badge-hospital",
    },
  ],
  SUBJECT_CLERK: [
    {
      title: "Ward Submission Status",
      description: "Monitor census submissions from all wards",
      icon: Building2,
      url: "/calculations",
      color: "text-primary",
    },
    {
      title: "Run Calculation",
      description: "Calculate ingredient requirements from census data",
      icon: Calculator,
      url: "/calculations",
      color: "text-badge-subject",
    },
    {
      title: "Purchase Orders",
      description: "View and manage purchase orders",
      icon: ShoppingCart,
      url: "/orders",
      color: "text-warning",
    },
  ],
  ACCOUNTANT: [
    {
      title: "Pending Approvals",
      description: "Review and approve purchase orders",
      icon: CheckSquare,
      url: "/approvals",
      color: "text-warning",
    },
    {
      title: "Invoices",
      description: "View and download invoices",
      icon: Receipt,
      url: "/invoices",
      color: "text-badge-hospital",
    },
    {
      title: "Price Management",
      description: "Update default item prices",
      icon: DollarSign,
      url: "/accountant/prices",
      color: "text-badge-accountant",
    },
    {
      title: "Financial Reports",
      description: "Track spending against allocated budgets",
      icon: BarChart3,
      url: "/reports",
      color: "text-primary",
    },
  ],
  KITCHEN: [
    {
      title: "Today's Cook Sheet",
      description: "View ingredient quantities for today's meals",
      icon: ChefHat,
      url: "/kitchen",
      color: "text-badge-kitchen",
    },
    {
      title: "Delivery Receiving",
      description: "Record incoming ingredient deliveries",
      icon: Truck,
      url: "/kitchen/receiving",
      color: "text-primary",
    },
    {
      title: "Issue Reports",
      description: "View delivery issue history",
      icon: AlertTriangle,
      url: "/kitchen/reports",
      color: "text-warning",
    },
  ],
  HOSPITAL_ADMIN: [
    {
      title: "Daily Meal Cycle",
      description: "Set today's patient and staff diet cycles",
      icon: CalendarDays,
      url: "/admin/daily-cycle",
      color: "text-primary",
    },
    {
      title: "Ward Configuration",
      description: "Manage hospital wards and bed counts",
      icon: Building2,
      url: "/admin/wards",
      color: "text-badge-hospital",
    },
    {
      title: "Norm Weights",
      description: "Configure standard ingredient weights per diet type",
      icon: Scale,
      url: "/admin/norm-weights",
      color: "text-badge-subject",
    },
    {
      title: "Items",
      description: "Manage food items and categories",
      icon: Package,
      url: "/admin/items",
      color: "text-warning",
    },
    {
      title: "Notifications",
      description: "View quality and delivery alerts",
      icon: Bell,
      url: "/admin/notifications",
      color: "text-destructive",
    },
  ],
  SYSTEM_ADMIN: [
    {
      title: "User Management",
      description: "Add, edit, and manage system users",
      icon: Users,
      url: "/system/users",
      color: "text-badge-admin",
    },
    {
      title: "Audit Logs",
      description: "View system activity and change history",
      icon: History,
      url: "/system/audit",
      color: "text-muted-foreground",
    },
    {
      title: "Backups",
      description: "Manage database backups",
      icon: Database,
      url: "/system/backups",
      color: "text-badge-hospital",
    },
    {
      title: "Settings",
      description: "Configure system settings",
      icon: Settings,
      url: "/system/settings",
      color: "text-primary",
    },
  ],
};