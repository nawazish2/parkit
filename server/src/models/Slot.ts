import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { ParkingLot } from './ParkingLot';

export class Slot extends Model {
  public declare id: number;
  public declare lotId: number;
  public declare slotNumber: string; // e.g., 'A1', 'B2'
  public declare isAvailable: boolean;
}

Slot.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    lotId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    slotNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'slots',
    timestamps: true,
    indexes: [
      { fields: ['lotId'] },
    ],
  }
);

Slot.belongsTo(ParkingLot, { foreignKey: 'lotId', as: 'lot' });
ParkingLot.hasMany(Slot, { foreignKey: 'lotId', as: 'slots' });
