# Deploying Timesheet Tracker Infrastructure

This guide explains how to deploy the Azure Cosmos DB infrastructure for the Timesheet Tracker application.

## Prerequisites

- Azure CLI installed and configured
- An active Azure subscription
- Permissions to create resources in Azure

## Deployment Steps

### 1. Login to Azure

```bash
az login
```

### 2. Set Your Subscription

```bash
az account set --subscription "<your-subscription-id>"
```

### 3. Create a Resource Group

```bash
az group create \
  --name timesheet-tracker-rg \
  --location eastus
```

### 4. Deploy the Bicep Template

```bash
az deployment group create \
  --resource-group timesheet-tracker-rg \
  --template-file infra/main.bicep \
  --parameters environmentName=dev
```

### 5. Retrieve Cosmos DB Connection Information

After deployment, get the outputs:

```bash
az deployment group show \
  --resource-group timesheet-tracker-rg \
  --name main \
  --query properties.outputs
```

Get the Cosmos DB primary key:

```bash
COSMOS_ACCOUNT_NAME=$(az deployment group show \
  --resource-group timesheet-tracker-rg \
  --name main \
  --query properties.outputs.cosmosDbAccountName.value -o tsv)

az cosmosdb keys list \
  --name $COSMOS_ACCOUNT_NAME \
  --resource-group timesheet-tracker-rg \
  --query primaryMasterKey -o tsv
```

### 6. Configure Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
VITE_COSMOS_DB_ENDPOINT=<endpoint-from-outputs>
VITE_COSMOS_DB_KEY=<primary-key-from-step-5>
VITE_COSMOS_DB_DATABASE_NAME=timesheetdb
VITE_COSMOS_DB_PROJECTS_CONTAINER=projects
VITE_COSMOS_DB_ENTRIES_CONTAINER=entries
```

### 7. Run the Application

```bash
npm run dev
```

## Cleanup

To delete all resources:

```bash
az group delete --name timesheet-tracker-rg --yes --no-wait
```

## Cost Considerations

The Bicep template deploys Cosmos DB in **Serverless** mode, which means:
- No minimum charge when not in use
- Pay only for Request Units (RUs) consumed
- Storage costs apply for data stored
- Ideal for development and low-traffic applications

For production workloads, consider switching to provisioned throughput.
