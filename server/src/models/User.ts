import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

export class User extends Model {
  public declare id: number;
  public declare name: string;
  public declare email: string;
  public declare password: string;
  public declare role: 'driver' | 'owner' | 'admin';
  public declare savedVehicles: string;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('driver', 'owner', 'admin'),
      defaultValue: 'driver',
    },
    savedVehicles: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '[]',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  }
);
