import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AuditLogAttributes {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'organization_id' | 'user_id' | 'resource_id' | 'metadata' | 'ip_address' | 'user_agent' | 'created_at'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  declare id: string;
  declare organization_id: string | null;
  declare user_id: string | null;
  declare action: string;
  declare resource_type: string;
  declare resource_id: string | null;
  declare metadata: Record<string, any> | null;
  declare ip_address: string | null;
  declare user_agent: string | null;
  declare readonly created_at: Date;
}

AuditLog.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organization_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'organizations',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  action: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  resource_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  resource_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.INET,
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  tableName: 'audit_logs',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['organization_id', 'created_at'] },
    { fields: ['user_id', 'created_at'] },
    { fields: ['resource_type', 'resource_id'] },
    { fields: ['action'] }
  ]
});

export default AuditLog;
