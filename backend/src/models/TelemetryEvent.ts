import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TelemetryEventAttributes {
  id: string;
  agent_id: string;
  organization_id: string;
  event_type: string;
  timestamp: Date;
  value?: number;
  unit?: string;
  metadata: Record<string, any>;
  created_at: Date;
}

interface TelemetryEventCreationAttributes extends Optional<TelemetryEventAttributes, 'id' | 'value' | 'unit' | 'metadata' | 'created_at'> {}

class TelemetryEvent extends Model<TelemetryEventAttributes, TelemetryEventCreationAttributes> implements TelemetryEventAttributes {
  declare id: string;
  declare agent_id: string;
  declare organization_id: string;
  declare event_type: string;
  declare timestamp: Date;
  declare value: number | undefined;
  declare unit: string | undefined;
  declare metadata: Record<string, any>;
  declare readonly created_at: Date;
}

TelemetryEvent.init(
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
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'id'
      }
    },
    event_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false
    },
    value: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    unit: {
      type: DataTypes.STRING(50),
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
    }
  },
  {
    sequelize,
    tableName: 'telemetry_events',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['agent_id'] },
      { fields: ['organization_id'] },
      { fields: ['event_type'] },
      { fields: ['timestamp'] }
    ]
  }
);

export default TelemetryEvent;
