import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CommandAttributes {
  id: string;
  agent_id: string;
  organization_id: string;
  issued_by?: string;
  command_type: string;
  parameters: Record<string, any>;
  status: 'pending' | 'sent' | 'acknowledged' | 'executing' | 'completed' | 'failed' | 'expired' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expires_at?: Date;
  acknowledged_at?: Date;
  completed_at?: Date;
  result?: Record<string, any>;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

interface CommandCreationAttributes extends Optional<CommandAttributes, 'id' | 'issued_by' | 'parameters' | 'status' | 'priority' | 'expires_at' | 'acknowledged_at' | 'completed_at' | 'result' | 'error_message' | 'created_at' | 'updated_at'> {}

class Command extends Model<CommandAttributes, CommandCreationAttributes> implements CommandAttributes {
  declare id: string;
  declare agent_id: string;
  declare organization_id: string;
  declare issued_by: string | undefined;
  declare command_type: string;
  declare parameters: Record<string, any>;
  declare status: 'pending' | 'sent' | 'acknowledged' | 'executing' | 'completed' | 'failed' | 'expired' | 'cancelled';
  declare priority: 'low' | 'normal' | 'high' | 'urgent';
  declare expires_at: Date | undefined;
  declare acknowledged_at: Date | undefined;
  declare completed_at: Date | undefined;
  declare result: Record<string, any> | undefined;
  declare error_message: string | undefined;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Command.init(
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
    issued_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    command_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    parameters: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'sent', 'acknowledged', 'executing', 'completed', 'failed', 'expired', 'cancelled']]
      }
    },
    priority: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'normal',
      validate: {
        isIn: [['low', 'normal', 'high', 'urgent']]
      }
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    acknowledged_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    result: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'commands',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['agent_id'] },
      { fields: ['organization_id'] },
      { fields: ['status'] },
      { fields: ['created_at'] },
      { fields: ['issued_by'] }
    ]
  }
);

export default Command;
