-- AutoHealX Phase 2: Agent Integration & Real-Time Communication
-- PostgreSQL 15+

-- ==============================================
-- AGENTS - Agent Registry
-- ==============================================
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  hostname VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'windows', 'linux', 'darwin'
  version VARCHAR(50) NOT NULL, -- Agent version
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_heartbeat_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_organization_id ON agents(organization_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_last_heartbeat_at ON agents(last_heartbeat_at);
CREATE INDEX idx_agents_hostname ON agents(hostname);

-- ==============================================
-- AGENT CREDENTIALS - API Key Storage
-- ==============================================
CREATE TABLE agent_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  api_key_hash TEXT NOT NULL, -- bcrypt hash
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_credentials_agent_id ON agent_credentials(agent_id);
CREATE INDEX idx_agent_credentials_revoked_at ON agent_credentials(revoked_at);

-- ==============================================
-- AGENT HEARTBEATS - Health Tracking
-- ==============================================
CREATE TABLE agent_heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(50) NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  metrics JSONB DEFAULT '{}'::jsonb, -- {cpu_usage, memory_usage, disk_usage}
  services_count INTEGER DEFAULT 0,
  incidents_count INTEGER DEFAULT 0
);

CREATE INDEX idx_agent_heartbeats_agent_id ON agent_heartbeats(agent_id);
CREATE INDEX idx_agent_heartbeats_timestamp ON agent_heartbeats(timestamp DESC);

-- ==============================================
-- TELEMETRY EVENTS - Raw Metrics Storage
-- ==============================================
CREATE TABLE telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- 'cpu', 'memory', 'disk', 'network', 'process'
  timestamp TIMESTAMP NOT NULL,
  value NUMERIC,
  unit VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_telemetry_events_agent_id ON telemetry_events(agent_id);
CREATE INDEX idx_telemetry_events_organization_id ON telemetry_events(organization_id);
CREATE INDEX idx_telemetry_events_event_type ON telemetry_events(event_type);
CREATE INDEX idx_telemetry_events_timestamp ON telemetry_events(timestamp DESC);

-- ==============================================
-- SERVICE HEALTH SNAPSHOTS - Service Status
-- ==============================================
CREATE TABLE service_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  timestamp TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
  response_time_ms INTEGER,
  http_status_code INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_health_snapshots_agent_id ON service_health_snapshots(agent_id);
CREATE INDEX idx_service_health_snapshots_service_id ON service_health_snapshots(service_id);
CREATE INDEX idx_service_health_snapshots_timestamp ON service_health_snapshots(timestamp DESC);
CREATE INDEX idx_service_health_snapshots_status ON service_health_snapshots(status);

-- ==============================================
-- COMMANDS - Command Lifecycle Management
-- ==============================================
CREATE TABLE commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
  command_type VARCHAR(100) NOT NULL, -- 'KILL_PROCESS', 'RESTART_SERVICE', 'CLEAR_CACHE', etc.
  parameters JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'executing', 'completed', 'failed', 'expired', 'cancelled')),
  priority VARCHAR(50) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  completed_at TIMESTAMP,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commands_agent_id ON commands(agent_id);
CREATE INDEX idx_commands_organization_id ON commands(organization_id);
CREATE INDEX idx_commands_status ON commands(status);
CREATE INDEX idx_commands_created_at ON commands(created_at DESC);
CREATE INDEX idx_commands_issued_by ON commands(issued_by);

-- ==============================================
-- COMMAND EVENTS - Audit Trail for Commands
-- ==============================================
CREATE TABLE command_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id UUID NOT NULL REFERENCES commands(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- 'created', 'sent', 'acknowledged', 'completed', 'failed'
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_command_events_command_id ON command_events(command_id);
CREATE INDEX idx_command_events_created_at ON command_events(created_at DESC);

-- ==============================================
-- DETECTION RESULTS - Agent Detections
-- ==============================================
CREATE TABLE detection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  detection_type VARCHAR(100) NOT NULL, -- 'HIGH_CPU', 'MEMORY_LEAK', 'PROCESS_CRASH', etc.
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  message TEXT NOT NULL,
  suggested_action VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_detection_results_agent_id ON detection_results(agent_id);
CREATE INDEX idx_detection_results_organization_id ON detection_results(organization_id);
CREATE INDEX idx_detection_results_incident_id ON detection_results(incident_id);
CREATE INDEX idx_detection_results_severity ON detection_results(severity);
CREATE INDEX idx_detection_results_detected_at ON detection_results(detected_at DESC);

-- ==============================================
-- POLICIES - Command Authorization Rules
-- ==============================================
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  command_type VARCHAR(100) NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT true,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  auto_execute BOOLEAN NOT NULL DEFAULT false,
  conditions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policies_organization_id ON policies(organization_id);
CREATE INDEX idx_policies_command_type ON policies(command_type);

-- ==============================================
-- TRIGGERS - Auto-update Timestamps
-- ==============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commands_updated_at BEFORE UPDATE ON commands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- DEFAULT POLICIES - Safe Defaults
-- ==============================================
INSERT INTO policies (organization_id, name, command_type, allowed, requires_approval, auto_execute, conditions)
SELECT 
  id,
  'Allow CPU Process Kill',
  'KILL_TOP_CPU_PROCESS',
  true,
  false,
  true,
  '{"max_cpu_threshold": 90}'::jsonb
FROM organizations;

INSERT INTO policies (organization_id, name, command_type, allowed, requires_approval, auto_execute, conditions)
SELECT 
  id,
  'Allow Memory Process Kill',
  'KILL_TOP_MEMORY_PROCESS',
  true,
  false,
  true,
  '{"max_memory_threshold": 88}'::jsonb
FROM organizations;

INSERT INTO policies (organization_id, name, command_type, allowed, requires_approval, auto_execute, conditions)
SELECT 
  id,
  'Require Approval for Specific Process Kill',
  'KILL_SPECIFIC_PROCESS',
  true,
  true,
  false,
  '{}'::jsonb
FROM organizations;
