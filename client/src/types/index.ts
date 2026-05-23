// Global TypeScript types for ParkIt

export interface Vehicle {
  type: string;
  plate: string;
  label?: string;
  isDefault?: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'driver' | 'owner' | 'admin';
  savedVehicles?: Vehicle[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  syncProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

export interface ParkingLot {
  id: number;
  ownerId: number;
  name: string;
  address: string;
  city: string;
  pricePerHour: number;
  status: 'pending' | 'approved' | 'rejected';
  photos: string; // JSON string
  amenities: string; // JSON string
  createdAt: string;
  owner?: User;
}

export interface Slot {
  id: number;
  lotId: number;
  slotNumber: string;
  isAvailable: boolean;
}

export interface Booking {
  id: number;
  userId: number;
  lotId: number;
  slotId: number;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  qrCode: string;
  vehicleType?: string;
  licensePlate?: string;
  lot?: ParkingLot;
  slot?: Slot;
  createdAt?: string;
  updatedAt?: string;
}
