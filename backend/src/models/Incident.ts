import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface IncidentAttributes {
  id: string;
  organization_id: string;
  project_id: string | null;
  service_id: string | null;
  incident_number: string;
  title: string;
  description: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'detected' | 'investigating' | 'identified' | 'remediation_pending' | 'remediating' | 'resolved' | 'closed';
  detected_at: Date;
  acknowledged_at: Date | null;
  resolved_at: Date | null;
  root_cause: string | null;
  confidence: number | null;
  created_at: Date;
  updated_at: Date;
}

interface IncidentCreationAttributes extends Optional<IncidentAttributes, 'id' | 'project_id' | 'service_id' | 'description' | 'status' | 'acknowledged_at' | 'resolved_at' | 'root_cause' | 'confidence' | 'created_at' | 'updated_at'> {}

class Incident extends Model<IncidentAttributes, IncidentCreationAttributes> implements IncidentAttributes {
  declare id: string;
  declare organization_id: string;
  declare project_id: string | null;
  declare service_id: string | null;
  declare incident_number: string;
  declare title: string;
  declare description: string | null;
  declare severity: 'critical' | 'high' | 'medium' | 'low';
  declare status: 'detected' | 'investigating' | 'identified' | 'remediation_pending' | 'remediating' | 'resolved' | 'closed';
  declare detected_at: Date;
  declare acknowledged_at: Date | null;
  declare resolved_at: Date | null;
  declare root_cause: string | null;
  declare confidence: number | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Incident.init({
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
  service_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'services',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  incident_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  severity: {
    type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('detected', 'investigating', 'identified', 'remediation_pending', 'remediating', 'resolved', 'closed'),
    defaultValue: 'detected',
    allowNull: false
  },
  detected_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  acknowledged_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  root_cause: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  confidence: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 1
    }
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
  tableName: 'incidents',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['project_id'] },
    { fields: ['service_id'] },
    { fields: ['status'] },
    { fields: ['severity'] },
    { fields: ['detected_at'] },
    { fields: ['incident_number'], unique: true }
  ]
});

export default Incident;
