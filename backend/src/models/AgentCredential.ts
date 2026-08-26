import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AgentCredentialAttributes {
  id: string;
  agent_id: string;
  api_key_hash: string;
  expires_at?: Date;
  revoked_at?: Date;
  last_used_at?: Date;
  created_at: Date;
}

interface AgentCredentialCreationAttributes extends Optional<AgentCredentialAttributes, 'id' | 'expires_at' | 'revoked_at' | 'last_used_at' | 'created_at'> {}

class AgentCredential extends Model<AgentCredentialAttributes, AgentCredentialCreationAttributes> implements AgentCredentialAttributes {
  declare id: string;
  declare agent_id: string;
  declare api_key_hash: string;
  declare expires_at: Date | undefined;
  declare revoked_at: Date | undefined;
  declare last_used_at: Date | undefined;
  declare readonly created_at: Date;
}

AgentCredential.init(
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
    api_key_hash: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'agent_credentials',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['agent_id'] },
      { fields: ['revoked_at'] }
    ]
  }
);

export default AgentCredential;
