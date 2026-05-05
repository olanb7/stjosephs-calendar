@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Short project/environment prefix, e.g. stjosephspta-prod.')
param namePrefix string

@description('Function app name. Must be globally unique.')
param functionAppName string

@description('Storage account name. Must be globally unique and 3-24 lowercase letters/numbers.')
param storageAccountName string

@description('Blob container name that will host the public ICS feed.')
param feedContainerName string = 'calendar'

@description('Blob name for the published ICS file.')
param feedBlobName string = 'stjosephsps.ics'

@description('Public calendar source URL.')
param calendarBaseUrl string = 'https://www.stjosephsps.co.uk/Calendar'

@description('Number of months to walk from the current month.')
param calendarMonthCount int = 13

@description('Function timer schedule in NCRONTAB format.')
param dailySchedule string = '0 0 6 * * *'

@description('Application Insights resource name.')
param appInsightsName string = '${namePrefix}-appi'

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource feedContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  name: '${storage.name}/default/${feedContainerName}'
  properties: {
    publicAccess: 'Blob'
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
  }
}

resource hostingPlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${namePrefix}-plan'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  kind: 'functionapp'
  properties: {
    reserved: true
  }
}

resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    httpsOnly: true
    serverFarmId: hostingPlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsights.properties.InstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${listKeys(storage.id, storage.apiVersion).keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
        }
        {
          name: 'BLOB_STORAGE_CONNECTION_STRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${listKeys(storage.id, storage.apiVersion).keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
        }
        {
          name: 'CALENDAR_BASE_URL'
          value: calendarBaseUrl
        }
        {
          name: 'CALENDAR_MONTH_COUNT'
          value: string(calendarMonthCount)
        }
        {
          name: 'CALENDAR_TIMEZONE'
          value: 'Europe/London'
        }
        {
          name: 'DAILY_SCHEDULE'
          value: dailySchedule
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'ICS_BLOB_CONTAINER'
          value: feedContainerName
        }
        {
          name: 'ICS_BLOB_NAME'
          value: feedBlobName
        }
        {
          name: 'ICS_CALENDAR_NAME'
          value: 'St Joseph''s Primary School Calendar'
        }
        {
          name: 'PUBLIC_FEED_BASE_URL'
          value: 'https://${storage.name}.blob.${environment().suffixes.storage}/${feedContainerName}/${feedBlobName}'
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
      ]
      ftpsState: 'Disabled'
      linuxFxVersion: 'Node|20'
      minTlsVersion: '1.2'
    }
  }
}

output functionAppName string = functionApp.name
output publicFeedUrl string = 'https://${storage.name}.blob.${environment().suffixes.storage}/${feedContainerName}/${feedBlobName}'
