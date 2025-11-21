// Main Bicep template for Timesheet Tracker Infrastructure
targetScope = 'resourceGroup'

@description('The location for all resources')
param location string = resourceGroup().location

@description('The name of the Cosmos DB account')
param cosmosDbAccountName string = 'timesheet-cosmos-${uniqueString(resourceGroup().id)}'

@description('Environment name (dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environmentName string = 'dev'

@description('Tags to apply to all resources')
param tags object = {
  application: 'timesheet-tracker'
  environment: environmentName
  managedBy: 'bicep'
}

// Deploy Cosmos DB
module cosmosDb 'cosmos.bicep' = {
  name: 'cosmosDbDeployment'
  params: {
    accountName: cosmosDbAccountName
    location: location
    tags: tags
  }
}

// Outputs
output cosmosDbEndpoint string = cosmosDb.outputs.endpoint
output cosmosDbAccountName string = cosmosDb.outputs.accountName
output cosmosDbDatabaseName string = cosmosDb.outputs.databaseName
output cosmosDbProjectsContainerName string = cosmosDb.outputs.projectsContainerName
output cosmosDbEntriesContainerName string = cosmosDb.outputs.entriesContainerName

// Note: Primary key should be retrieved separately using Azure CLI:
// az cosmosdb keys list --name <accountName> --resource-group <resourceGroup> --query primaryMasterKey -o tsv
