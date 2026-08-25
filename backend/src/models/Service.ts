import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ServiceAttributes {
  id: string;
  organization_id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  environment: 'development' | 'staging' | 'production';
  version: string | null;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  created_at: Date;
  updated_at: Date;
}

interface ServiceCreationAttributes extends Optional<ServiceAttributes, 'id' | 'project_id' | 'description' | 'environment' | 'version' | 'status' | 'created_at' | 'updated_at'> {}

class Service extends Model<ServiceAttributes, ServiceCreationAttributes> implements ServiceAttributes {
  declare id: string;
  declare organization_id: string;
  declare project_id: string | null;
  declare name: string;
  declare description: string | null;
  declare environment: 'development' | 'staging' | 'production';
  declare version: string | null;
  declare status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Service.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organization_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  project_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  environment: {
    type: DataTypes.ENUM('development', 'staging', 'production'),
    defaultValue: 'development',
    allowNull: false
  },
  version: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('healthy', 'degraded', 'unhealthy', 'unknown'),
    defaultValue: 'unknown',
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  tableName: 'services',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['project_id'] },
    { fields: ['status'] },
    { fields: ['environment'] }
  ]
});

export default Service;
