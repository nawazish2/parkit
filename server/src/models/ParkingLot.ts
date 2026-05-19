import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { User } from './User';

export class ParkingLot extends Model {
  public declare id: number;
  public declare ownerId: number;
  public declare name: string;
  public declare address: string;
  public declare city: string;
  public declare pricePerHour: number;
  public declare status: 'pending' | 'approved' | 'rejected';
  public declare photos: string; // JSON string of urls
  public declare amenities: string; // JSON string
}

ParkingLot.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pricePerHour: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    photos: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
    },
    amenities: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
    },
  },
  {
    sequelize,
    tableName: 'parking_lots',
    timestamps: true,
  }
);

ParkingLot.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasMany(ParkingLot, { foreignKey: 'ownerId' });
