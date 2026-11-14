# Azure student deployment lab

Read this once before creating resources. This is a deployment recipe, not a claim that an Azure deployment has already been tested. Local integration tests use native MongoDB; repeat the workflow checks below against your chosen Azure database.

## 1. Subscription, cost and database

1. Sign in to portal.azure.com with the student account. Select **Azure for Students**, rather than another subscription. Check remaining credit in Education Hub / Sponsorships. [Student offer](https://azure.microsoft.com/en-us/free/students/) currently includes $100 credit; eligibility, renewal and service availability depend on the account. This project is a learning/demo deployment.
2. Create a resource group named `rg-jugaad-lab`. Use one region supported by your subscription and database free tier. If Central India is unavailable, select another allowed region; do not silently choose a paid tier.
3. In Cost Management, create a small monthly budget and alerts (for example $5 with 50%, 80% and 100% alerts). **A budget alert is not a spending cap.** Review credits and costs after every lab.
4. Create **Azure DocumentDB (MongoDB compatibility)** and explicitly select **Free Tier**. The current [free-tier documentation](https://learn.microsoft.com/en-us/azure/documentdb/free-tier) lists 32 GB and selected regions, one free cluster per subscription, no backup/restore or HA, and pause after 60 days of inactivity. This product may appear under its former Cosmos DB for MongoDB vCore name. Do not choose Cosmos DB for NoSQL: this app needs the MongoDB wire protocol. If the free option is absent, stop and check student/region eligibility before accepting a paid estimate. Native MongoDB Atlas can also supply `MONGO_URI`, but its billing is separate from student Azure credits.
5. Store the connection string privately. Keep its TLS and authentication options intact; URL-encode special password characters. Never disable certificate validation. In the database network settings initially allow only your own public IP for a connection check. After Container Apps exist, allow their documented outbound IP addresses through database firewall rules. Find the outbound addresses in the Container Apps environment/networking view and use the full list. Default egress addresses may change: recheck after environment changes. Do not open the database to `0.0.0.0/0`. If stable egress is needed, VNet/NAT or private networking is a later, separately priced exercise.
6. Create a fresh cluster for this lab, not an existing production database. The services create their own databases, collections and indexes on first connection. Use per-service database users when your selected provider supports them; the commands below accept a separate URI for each service. A single cluster admin URI is convenient only for initial synthetic-data testing and should be replaced afterward.

## 2. Build and publish images on GitHub

Merge this migration PR first. In the repository’s **Actions**, run **Publish container images** on the merged branch. It produces:

- `ghcr.io/brocoder007/jugaad-service:<full-commit-sha>`
- `ghcr.io/brocoder007/jugaad-gateway:<full-commit-sha>`

Open your GitHub profile → Packages → each of these two packages → Package settings and set the images to **public** so Azure can pull them without registry credentials. Source code and images contain no `.env`, database, tokens or runtime secrets. If you prefer private packages, configure Azure registry authentication separately instead. Use the same full commit SHA for both images; do not deploy mutable `latest` tags.

## 3. Create the Container Apps environment

Install the official Azure CLI locally, or use Azure Cloud Shell in PowerShell mode. Commands below use PowerShell syntax. Never type secret values directly into command history.

```powershell
az login
az account list --query '[].{Name:name,Id:id}' -o table
$subscription = Read-Host 'Student subscription ID'
az account set --subscription $subscription
az extension add --name containerapp --upgrade
az provider register --namespace Microsoft.App --wait
az provider register --namespace Microsoft.OperationalInsights --wait
$region = 'centralindia' # change if your student subscription requires it
$group = 'rg-jugaad-lab'
$environment = 'jugaad-lab'
az group create --name $group --location $region --output none
az containerapp env create --name $environment --resource-group $group --location $region --logs-destination none --output none
$sha = Read-Host 'Full commit SHA used by the image workflow'
$serviceImage = "ghcr.io/brocoder007/jugaad-service:$sha"
$gatewayImage = "ghcr.io/brocoder007/jugaad-gateway:$sha"
```

`--logs-destination none` avoids creating a paid Log Analytics workspace for the first lab. Live console logs still help debugging; add a workspace with a retention/ingestion budget later. Resource tags, secrets and TLS still matter even in a student account.

## 4. Deploy internal services

Generate one random shared signing key in memory. Read database credentials with hidden input. Azure CLI receives the resolved values as process arguments, so run on a trusted machine; avoid terminal recording/debug output and never print these variables. For stronger secret handling, use Key Vault references and managed identity as the extension exercise below.

```powershell
$jwt = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
function Read-PrivateValue([string]$label) {
  $secure = Read-Host $label -AsSecureString
  return [Net.NetworkCredential]::new('', $secure).Password
}
foreach ($service in @('identity','marketplace','messaging')) {
  $uri = Read-PrivateValue "MongoDB URI for $service"
  $variables = @("SERVICE=$service",'PORT=3000','JWT_SECRET=secretref:jwt','MONGO_URI=secretref:mongo')
  if ($service -eq 'messaging') {
    $marketHost = az containerapp show --name marketplace --resource-group $group --query properties.configuration.ingress.fqdn -o tsv
    $variables += "MARKETPLACE_URL=https://$marketHost"
  }
  az containerapp create --name $service --resource-group $group --environment $environment `
    --image $serviceImage --ingress internal --target-port 3000 `
    --cpu 0.25 --memory 0.5Gi --min-replicas 0 --max-replicas 1 `
    --secrets "jwt=$jwt" "mongo=$uri" --env-vars $variables --output none
  if ($LASTEXITCODE -ne 0) { throw "Deployment failed for $service; inspect the portal before continuing" }
  $uri = $null
}
$jwt = $null
```

Add the environment’s outbound addresses to your database firewall as described in step 1, then verify revisions become healthy. A failed database connection exits the service; Azure restarts it, so correct the URI/firewall and inspect revision logs. Internal **HTTP ingress remains enabled** so requests can wake a service scaled to zero. Do not disable ingress entirely.

0.25 CPU / 0.5 GiB is an initial lab allocation, not a measured capacity guarantee. Watch memory and latency and adjust if necessary. One replica keeps process-local rate limits predictable. Three services plus a gateway still consume credit when active; the free grant is shared across the subscription.

## 5. Deploy the public gateway and Angular frontend

```powershell
$identityHost = az containerapp show -g $group -n identity --query properties.configuration.ingress.fqdn -o tsv
$marketHost = az containerapp show -g $group -n marketplace --query properties.configuration.ingress.fqdn -o tsv
$messageHost = az containerapp show -g $group -n messaging --query properties.configuration.ingress.fqdn -o tsv
az containerapp create --name jugaad-web --resource-group $group --environment $environment `
  --image $gatewayImage --ingress external --target-port 8080 `
  --cpu 0.25 --memory 0.5Gi --min-replicas 0 --max-replicas 1 `
  --env-vars "IDENTITY_URL=https://$identityHost" "MARKETPLACE_URL=https://$marketHost" "MESSAGING_URL=https://$messageHost" `
  --output none
$webHost = az containerapp show -g $group -n jugaad-web --query properties.configuration.ingress.fqdn -o tsv
"Open https://$webHost"
```

The generated HTTPS address serves Angular and `/api` through one origin. No frontend API key, CORS wildcard or public database URL is needed. Identity, marketplace and messaging should all show **internal** ingress; only `jugaad-web` is external. Leave insecure HTTP disabled. App settings must use HTTPS for internal Azure FQDNs (local Compose uses HTTP inside its network).

## 6. Verify the real deployment

- Open `/healthz` at the web URL, then browse the storefront. Gateway liveness alone does not prove database connectivity.
- Register seller and buyer accounts with synthetic data. Use separate browser sessions, list an item, send an offer/message, verify the seller receives it, accept it and check the item is sold.
- Verify a third account cannot see either party’s conversation or accept the offer.
- Restart a service revision from the portal, then check listings and messages persist. The data must be in the managed database, never a container filesystem.
- Leave it idle, then return and observe a cold start. The gateway times out rather than hanging indefinitely; wait and retry if dependencies are still waking. If instant response matters during a demo, temporarily set each app’s minimum replicas to 1, then return them to 0 afterward. This increases idle cost.
- Check revisions, request count, CPU/memory metrics, remaining student credit and the cost view. A node process can use memory even when few users visit.

Troubleshooting: image-pull failure → check public GHCR visibility and SHA; 503 → check backend revision health and internal URLs; database timeout → URI/TLS/firewall; invalid login after redeployment → confirm all three services use the same signing key. Never paste secrets into issues. No Azure compatibility test or deployment was performed automatically by this migration.

## 7. Grow your Azure skills

1. **Secret management:** create a Key Vault and managed identities. Give each app access only to its needed secrets, then replace embedded Container Apps secrets with Key Vault references. Do not grant a broad subscription role.
2. **Observability:** attach Log Analytics, add a low ingestion cap and use request/latency metrics. Keep message contents and credentials out of logs. Add correlation IDs across gateway and services.
3. **Safe releases:** deploy a new immutable image tag to a new revision; verify before switching traffic and practice rolling back. Database compatibility must survive rollback.
4. **Networking:** learn private endpoints or stable egress before using real user data. Compare the cost of NAT and VNet infrastructure against student credit.
5. **Asynchronous work:** add Service Bus only when adding a feature that needs it, such as sale notifications. Use an outbox and idempotent consumer; do not publish an event before the sale is committed.

[Container Apps ingress](https://learn.microsoft.com/en-us/azure/container-apps/ingress), [secrets](https://learn.microsoft.com/en-us/azure/container-apps/manage-secrets), [scaling](https://learn.microsoft.com/en-us/azure/container-apps/scale-app), [billing](https://learn.microsoft.com/en-us/azure/container-apps/billing).

## 8. Stop and clean up

Setting min replicas to zero does not delete the environment/database or guarantee zero total cost. Export any synthetic data you want to keep before cleanup. Delete only the dedicated lab resource group in the portal after reviewing every listed resource. If your database was created in another group, manage it separately. Never run broad subscription cleanup commands. Container Apps disks are ephemeral; [storage guidance](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts) explains why the database is external.
