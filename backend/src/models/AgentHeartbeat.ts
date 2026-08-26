import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AgentHeartbeatAttributes {
  id: string;
  agent_id: string;
  timestamp: Date;
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: Record<string, any>;
  services_count: number;
  incidents_count: number;
}

interface AgentHeartbeatCreationAttributes extends Optional<AgentHeartbeatAttributes, 'id' | 'timestamp' | 'metrics' | 'services_count' | 'incidents_count'> {}

class AgentHeartbeat extends Model<AgentHeartbeatAttributes, AgentHeartbeatCreationAttributes> implements AgentHeartbeatAttributes {
  declare id: string;
  declare agent_id: string;
  declare timestamp: Date;
  declare status: 'healthy' | 'degraded' | 'unhealthy';
  declare metrics: Record<string, any>;
  declare services_count: number;
  declare incidents_count: number;
}

AgentHeartbeat.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    agent_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'agents',
        key: 'id'
      }
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['healthy', 'degraded', 'unhealthy']]
      }
    },
    metrics: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    services_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    incidents_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    tableName: 'agent_heartbeats',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['agent_id'] },
      { fields: ['timestamp'] }
    ]
  }
);

export default AgentHeartbeat;
