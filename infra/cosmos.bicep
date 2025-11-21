// Cosmos DB for NoSQL - Timesheet Tracker
@description('The name of the Cosmos DB account')
param accountName string

@description('The location for the Cosmos DB account')
param location string

@description('Tags to apply to resources')
param tags object

@description('The name of the database')
param databaseName string = 'timesheetdb'

// Cosmos DB Account
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: accountName
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
    enableFreeTier: false
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: false
    backupPolicy: {
      type: 'Continuous'
      continuousModeProperties: {
        tier: 'Continuous7Days'
      }
    }
  }
}

// Database
resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: cosmosAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
  }
}

// Projects Container
resource projectsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: database
  name: 'projects'
  properties: {
    resource: {
      id: 'projects'
      partitionKey: {
        paths: [
          '/id'
        ]
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
    }
  }
}

// Entries Container
resource entriesContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: database
  name: 'entries'
  properties: {
    resource: {
      id: 'entries'
      partitionKey: {
        paths: [
          '/projectId'
        ]
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
    }
  }
}

// Outputs
output endpoint string = cosmosAccount.properties.documentEndpoint
output accountName string = cosmosAccount.name
output databaseName string = database.name
output projectsContainerName string = projectsContainer.name
output entriesContainerName string = entriesContainer.name
output accountId string = cosmosAccount.id
