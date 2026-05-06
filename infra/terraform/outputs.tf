output "cloud_run_url" {
  description = "Cloud Run service URL — use this as app_url in tfvars"
  value       = google_cloud_run_v2_service.app.uri
}

output "artifact_registry_url" {
  description = "Docker registry base URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app.repository_id}"
}

output "workload_identity_provider" {
  description = "WIF provider — set as GCP_WIF_PROVIDER in GitHub Actions vars"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "cicd_service_account" {
  description = "CI/CD SA email — set as GCP_CICD_SA in GitHub Actions vars"
  value       = google_service_account.cicd.email
}

output "terraform_runner_service_account" {
  description = "Terraform runner SA email — set as GCP_TF_SA in GitHub Actions vars"
  value       = google_service_account.terraform_runner.email
}
