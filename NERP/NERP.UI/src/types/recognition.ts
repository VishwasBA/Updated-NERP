export interface Employee {
  id: string;
  name: string;
  avatar: string;
  department: string;
  role: string;
  totalPoints: number;
}

export interface Recognition {
  id: string;
  fromEmployee: Employee;
  toEmployee: Employee;
  message: string;
  category?: AwardCategory;
  points: number;
  createdAt: string;
  type: "appreciation" | "nomination";
  status: "approved" | "pending" | "rejected";
}

export interface AwardCategory {
  id: string;
  name: string;
  description: string;
  points: number;
  icon: string;
  managerOnly: boolean;
}

export type UserRole = "employee" | "manager" | "admin";

export interface CurrentUser extends Employee {
  userRole: UserRole;
}
