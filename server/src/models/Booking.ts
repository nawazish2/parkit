import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { User } from './User';
import { Slot } from './Slot';
import { ParkingLot } from './ParkingLot';

export class Booking extends Model {
  public declare id: number;
  public declare userId: number;
  public declare lotId: number;
  public declare slotId: number;
  public declare startTime: Date;
  public declare endTime: Date;
  public declare totalAmount: number;
  public declare status: 'pending' | 'confirmed' | 'cancelled';
  public declare qrCode: string;
  public declare vehicleType: string;
  public declare licensePlate: string;
}

Booking.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    lotId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    slotId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
      defaultValue: 'pending',
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    vehicleType: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Sedan',
    },
    licensePlate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'bookings',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['lotId'] },
      { fields: ['slotId'] },
      { fields: ['status'] },
    ],
  }
);

Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Booking.belongsTo(ParkingLot, { foreignKey: 'lotId', as: 'lot' });
Booking.belongsTo(Slot, { foreignKey: 'slotId', as: 'slot' });
