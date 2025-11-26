// Azure SQL Database Infrastructure for Timesheet Tracker
// This Bicep template creates an Azure SQL Server and Database (free tier)
// with Azure AD-only authentication and wide-open firewall for local development

@description('The location for all resources')
param location string = resourceGroup().location

@description('The name of the SQL Server (must be globally unique)')
param sqlServerName string = 'timesheet-sql-${uniqueString(resourceGroup().id)}'

@description('The name of the database')
param databaseName string = 'timesheetdb'

@description('The Azure AD admin object ID')
param aadAdminObjectId string

@description('The Azure AD admin login name (email/UPN)')
param aadAdminLogin string

@description('The Azure AD tenant ID')
param aadTenantId string = subscription().tenantId

// Azure SQL Server with Azure AD-only authentication
resource sqlServer 'Microsoft.Sql/servers@2023-08-01' = {
  name: sqlServerName
  location: location
  properties: {
    version: '12.0'
    publicNetworkAccess: 'Enabled'
    administrators: {
      administratorType: 'ActiveDirectory'
      login: aadAdminLogin
      sid: aadAdminObjectId
      tenantId: aadTenantId
      azureADOnlyAuthentication: true
      principalType: 'User'
    }
  }
}

// Firewall rule to allow all IPs (for local development only - NOT for production)
resource firewallRuleAllowAll 'Microsoft.Sql/servers/firewallRules@2023-08-01' = {
  parent: sqlServer
  name: 'AllowAll'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '255.255.255.255'
  }
}

// Allow Azure services to access the server
resource firewallRuleAzure 'Microsoft.Sql/servers/firewallRules@2023-08-01' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Azure SQL Database (Free tier - 32GB, 100 DTUs monthly free)
resource database 'Microsoft.Sql/servers/databases@2023-08-01' = {
  parent: sqlServer
  name: databaseName
  location: location
  sku: {
    name: 'GP_S_Gen5_2'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 2
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 34359738368 // 32GB
    autoPauseDelay: 60 // Auto-pause after 60 minutes of inactivity
    minCapacity: json('0.5') // Minimum 0.5 vCores when paused
    useFreeLimit: true // Use free tier
    freeLimitExhaustionBehavior: 'AutoPause' // Auto-pause when free limit exhausted
  }
}

// Outputs for connection string construction
@description('The fully qualified domain name of the SQL Server')
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName

@description('The name of the SQL Server')
output sqlServerName string = sqlServer.name

@description('The name of the database')
output databaseName string = database.name

@description('Note about Azure AD authentication')
output authNote string = 'Using Azure AD authentication. Use "az login" and DefaultAzureCredential for access.'
