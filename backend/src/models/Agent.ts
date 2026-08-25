import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface AgentAttributes {
  id: string;
  organization_id: string;
  name: string;
  hostname: string;
  platform: 'windows' | 'linux' | 'darwin';
  version: string;
  status: 'active' | 'inactive' | 'suspended';
  last_heartbeat_at?: Date;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

interface AgentCreationAttributes extends Optional<AgentAttributes, 'id' | 'status' | 'last_heartbeat_at' | 'metadata' | 'created_at' | 'updated_at'> {}

class Agent extends Model<AgentAttributes, AgentCreationAttributes> implements AgentAttributes {
  declare id: string;
  declare organization_id: string;
  declare name: string;
  declare hostname: string;
  declare platform: 'windows' | 'linux' | 'darwin';
  declare version: string;
  declare status: 'active' | 'inactive' | 'suspended';
  declare last_heartbeat_at: Date | undefined;
  declare metadata: Record<string, any>;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Agent.init(
  {
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
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    hostname: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    platform: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['windows', 'linux', 'darwin']]
      }
    },
    version: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'inactive', 'suspended']]
      }
    },
    last_heartbeat_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
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
  },
  {
    sequelize,
    tableName: 'agents',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['organization_id'] },
      { fields: ['status'] },
      { fields: ['last_heartbeat_at'] },
      { fields: ['hostname'] }
    ]
  }
);

export default Agent;
