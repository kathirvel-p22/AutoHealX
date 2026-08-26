# PowerShell script to fix TypeScript naming convention errors
# Converts camelCase property access to snake_case to match Sequelize models

$files = @(
    "src\controllers\agentController.ts",
    "src\controllers\telemetryController.ts",
    "src\services\agentService.ts",
    "src\services\telemetryService.ts",
    "src\middleware\authenticateAgent.ts"
)

$replacements = @{
    # Agent properties
    "agent\.organizationId" = "agent.organization_id"
    "agent\.createdAt" = "agent.created_at"
    "agent\.updatedAt" = "agent.updated_at"
    "agent\.lastHeartbeat" = "agent.last_heartbeat_at"
    "agent\.capabilities" = "agent.metadata.capabilities"
    
    # AgentCredential properties
    "credential\.apiKeyHash" = "credential.api_key_hash"
    "credential\.expiresAt" = "credential.expires_at"
    "credential\.lastUsedAt" = "credential.last_used_at"
    "credential\.agent" = "(credential as any).agent"
    
    # AgentHeartbeat properties (these are in metrics JSONB)
    "h\.cpuUsage" = "h.metrics.cpuUsage"
    "h\.memoryUsage" = "h.metrics.memoryUsage"
    "h\.processCount" = "h.metrics.processCount"
    "h\.createdAt" = "h.timestamp"
    
    # TelemetryEvent properties
    "e\.agentId" = "e.agent_id"
    "e\.serviceId" = "e.metadata.serviceId"
    "e\.eventType" = "e.event_type"
    "e\.createdAt" = "e.created_at"
    "e\.data" = "e.metadata"
    "event\.eventType" = "event.event_type"
    "event\.agentId" = "event.agent_id"
    
    # DetectionResult properties
    "detection\.detectionType" = "detection.detection_type"
    "detection\.detectedAt" = "detection.detected_at"
    "detection\.processed" = "detection.metadata.processed"
    "d\.agentId" = "d.agent_id"
    "d\.serviceId" = "d.metadata.serviceId"
    "d\.detectionType" = "d.detection_type"
    "d\.suggestedAction" = "d.suggested_action"
    "d\.detectedAt" = "d.detected_at"
    "d\.createdAt" = "d.created_at"
    
    # Object literal properties
    "organizationId:" = "organization_id:"
    "agentId:" = "agent_id:"
    "serviceId:" = "service_id:"
    "eventType:" = "event_type:"
    "detectionType:" = "detection_type:"
    "suggestedAction:" = "suggested_action:"
    "detectedAt:" = "detected_at:"
    "createdAt:" = "created_at:"
    "updatedAt:" = "updated_at:"
    "lastUsedAt:" = "last_used_at:"
    "expiresAt:" = "expires_at:"
    "revokedAt:" = "revoked_at:"
    "apiKeyHash:" = "api_key_hash:"
    
    # Where clause properties
    "{ agentId" = "{ agent_id"
    "{ organizationId" = "{ organization_id"
    "{ revokedAt:" = "{ revoked_at:"
    ", organizationId" = ", organization_id"
    
    # Update properties
    "lastUsedAt: new Date\(\)" = "last_used_at: new Date()"
    "revokedAt: new Date\(\)" = "revoked_at: new Date()"
    "processed: true" = "metadata: { processed: true }"
}

Write-Host "Starting TypeScript error fixes..." -ForegroundColor Cyan

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $fullPath) {
        Write-Host "`nProcessing: $file" -ForegroundColor Yellow
        $content = Get-Content $fullPath -Raw
        $originalContent = $content
        
        foreach ($pattern in $replacements.Keys) {
            $replacement = $replacements[$pattern]
            $content = $content -replace $pattern, $replacement
        }
        
        if ($content -ne $originalContent) {
            Set-Content $fullPath -Value $content -NoNewline
            Write-Host "  ✓ Fixed" -ForegroundColor Green
        } else {
            Write-Host "  - No changes needed" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ✗ File not found: $fullPath" -ForegroundColor Red
    }
}

Write-Host "`nDone! Run 'npx tsc --noEmit' to verify." -ForegroundColor Cyan
