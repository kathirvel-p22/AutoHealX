import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface OrganizationMemberAttributes {
  id: string;
  organization_id: string;
  user_id: string;
  role_id: string;
  created_at: Date;
}

interface OrganizationMemberCreationAttributes extends Optional<OrganizationMemberAttributes, 'id' | 'created_at'> {}

class OrganizationMember extends Model<OrganizationMemberAttributes, OrganizationMemberCreationAttributes> implements OrganizationMemberAttributes {
  declare id: string;
  declare organization_id: string;
  declare user_id: string;
  declare role_id: string;
  declare readonly created_at: Date;
}

OrganizationMember.init({
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
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  role_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  tableName: 'organization_members',
  timestamps: false,
  underscored: true,
  indexes: [
    { 
      unique: true,
      fields: ['organization_id', 'user_id']
    }
  ]
});

export default OrganizationMember;
