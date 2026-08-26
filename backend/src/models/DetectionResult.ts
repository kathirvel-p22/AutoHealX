import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface DetectionResultAttributes {
  id: string;
  agent_id: string;
  organization_id: string;
  incident_id?: string;
  detection_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence?: number;
  message: string;
  suggested_action?: string;
  metadata: Record<string, any>;
  detected_at: Date;
  created_at: Date;
}

interface DetectionResultCreationAttributes extends Optional<DetectionResultAttributes, 'id' | 'incident_id' | 'confidence' | 'suggested_action' | 'metadata' | 'created_at'> {}

class DetectionResult extends Model<DetectionResultAttributes, DetectionResultCreationAttributes> implements DetectionResultAttributes {
  declare id: string;
  declare agent_id: string;
  declare organization_id: string;
  declare incident_id: string | undefined;
  declare detection_type: string;
  declare severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  declare confidence: number | undefined;
  declare message: string;
  declare suggested_action: string | undefined;
  declare metadata: Record<string, any>;
  declare detected_at: Date;
  declare readonly created_at: Date;
}

DetectionResult.init(
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
    incident_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'incidents',
        key: 'id'
      }
    },
    detection_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    severity: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['critical', 'high', 'medium', 'low', 'info']]
      }
    },
    confidence: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 1
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    suggested_action: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    detected_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'detection_results',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['agent_id'] },
      { fields: ['organization_id'] },
      { fields: ['incident_id'] },
      { fields: ['severity'] },
      { fields: ['detected_at'] }
    ]
  }
);

export default DetectionResult;
