import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface IncidentEventAttributes {
  id: string;
  incident_id: string;
  event_type: string;
  description: string | null;
  actor_id: string | null;
  metadata: Record<string, any> | null;
  created_at: Date;
}

interface IncidentEventCreationAttributes extends Optional<IncidentEventAttributes, 'id' | 'description' | 'actor_id' | 'metadata' | 'created_at'> {}

class IncidentEvent extends Model<IncidentEventAttributes, IncidentEventCreationAttributes> implements IncidentEventAttributes {
  declare id: string;
  declare incident_id: string;
  declare event_type: string;
  declare description: string | null;
  declare actor_id: string | null;
  declare metadata: Record<string, any> | null;
  declare readonly created_at: Date;
}

IncidentEvent.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  incident_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'incidents',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  event_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actor_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  tableName: 'incident_events',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['incident_id', 'created_at'] },
    { fields: ['event_type'] }
  ]
});

export default IncidentEvent;
