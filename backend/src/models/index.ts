import Organization from './Organization';
import User from './User';
import Role from './Role';
import OrganizationMember from './OrganizationMember';
import Project from './Project';
import Service from './Service';
import Incident from './Incident';
import IncidentEvent from './IncidentEvent';
import AuditLog from './AuditLog';
import Agent from './Agent';
import AgentCredential from './AgentCredential';
import AgentHeartbeat from './AgentHeartbeat';
import TelemetryEvent from './TelemetryEvent';
import DetectionResult from './DetectionResult';

// Define associations
Organization.hasMany(User, { foreignKey: 'organization_id', as: 'users' });
User.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Organization.hasMany(Project, { foreignKey: 'organization_id', as: 'projects' });
Project.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Organization.hasMany(Service, { foreignKey: 'organization_id', as: 'services' });
Service.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Project.hasMany(Service, { foreignKey: 'project_id', as: 'services' });
Service.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

Organization.hasMany(Incident, { foreignKey: 'organization_id', as: 'incidents' });
Incident.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Project.hasMany(Incident, { foreignKey: 'project_id', as: 'incidents' });
Incident.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

Service.hasMany(Incident, { foreignKey: 'service_id', as: 'incidents' });
Incident.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

Incident.hasMany(IncidentEvent, { foreignKey: 'incident_id', as: 'events' });
IncidentEvent.belongsTo(Incident, { foreignKey: 'incident_id', as: 'incident' });

User.hasMany(IncidentEvent, { foreignKey: 'actor_id', as: 'incident_events' });
IncidentEvent.belongsTo(User, { foreignKey: 'actor_id', as: 'actor' });

Organization.belongsToMany(User, { 
  through: OrganizationMember, 
  foreignKey: 'organization_id',
  otherKey: 'user_id',
  as: 'members'
});

User.belongsToMany(Organization, { 
  through: OrganizationMember, 
  foreignKey: 'user_id',
  otherKey: 'organization_id',
  as: 'organizations'
});

Role.hasMany(OrganizationMember, { foreignKey: 'role_id', as: 'members' });
OrganizationMember.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// Phase 2: Agent associations
Organization.hasMany(Agent, { foreignKey: 'organization_id', as: 'agents' });
Agent.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Agent.hasMany(AgentCredential, { foreignKey: 'agent_id', as: 'credentials' });
AgentCredential.belongsTo(Agent, { foreignKey: 'agent_id', as: 'agent' });

Agent.hasMany(AgentHeartbeat, { foreignKey: 'agent_id', as: 'heartbeats' });
AgentHeartbeat.belongsTo(Agent, { foreignKey: 'agent_id', as: 'agent' });

Agent.hasMany(TelemetryEvent, { foreignKey: 'agent_id', as: 'telemetryEvents' });
TelemetryEvent.belongsTo(Agent, { foreignKey: 'agent_id', as: 'agent' });

Organization.hasMany(TelemetryEvent, { foreignKey: 'organization_id', as: 'telemetryEvents' });
TelemetryEvent.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Service.hasMany(TelemetryEvent, { foreignKey: 'service_id', as: 'telemetryEvents' });
TelemetryEvent.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

Agent.hasMany(DetectionResult, { foreignKey: 'agent_id', as: 'detectionResults' });
DetectionResult.belongsTo(Agent, { foreignKey: 'agent_id', as: 'agent' });

Organization.hasMany(DetectionResult, { foreignKey: 'organization_id', as: 'detectionResults' });
DetectionResult.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Service.hasMany(DetectionResult, { foreignKey: 'service_id', as: 'detectionResults' });
DetectionResult.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

Incident.hasMany(DetectionResult, { foreignKey: 'incident_id', as: 'detectionResults' });
DetectionResult.belongsTo(Incident, { foreignKey: 'incident_id', as: 'incident' });

export {
  Organization,
  User,
  Role,
  OrganizationMember,
  Project,
  Service,
  Incident,
  IncidentEvent,
  AuditLog,
  Agent,
  AgentCredential,
  AgentHeartbeat,
  TelemetryEvent,
  DetectionResult
};
