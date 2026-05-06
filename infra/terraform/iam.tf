# --- Runtime service account (identity Cloud Run runs as) ---
resource "google_service_account" "cloudrun_runtime" {
  account_id   = "${var.service_name}-runtime"
  display_name = "Cloud Run Runtime - ${var.service_name}"
}

# --- CI/CD service account (GitHub Actions impersonates this) ---
resource "google_service_account" "cicd" {
  account_id   = "${var.service_name}-cicd"
  display_name = "CI/CD Deploy - ${var.service_name}"
}

resource "google_project_iam_member" "cicd_artifact_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.cicd.email}"
}

resource "google_project_iam_member" "cicd_cloudrun_developer" {
  project = var.project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.cicd.email}"
}

# CI/CD SA must be allowed to act as the runtime SA when deploying Cloud Run
resource "google_service_account_iam_member" "cicd_act_as_runtime" {
  service_account_id = google_service_account.cloudrun_runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.cicd.email}"
}

# --- Workload Identity Federation for GitHub Actions ---
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-pool"
  display_name              = "GitHub Actions"
  depends_on                = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub OIDC"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }

  # Only allow tokens from the specific repo
  attribute_condition = "assertion.repository == '${var.github_owner}/${var.github_repo}'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Allow GitHub Actions to impersonate the CI/CD SA (deploy workflow)
resource "google_service_account_iam_member" "github_wif_cicd" {
  service_account_id = google_service_account.cicd.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_owner}/${var.github_repo}"
}

# --- Terraform runner service account (GitHub Actions terraform workflow) ---
resource "google_service_account" "terraform_runner" {
  account_id   = "${var.service_name}-tf-runner"
  display_name = "Terraform Runner - ${var.service_name}"
}

# Owner covers all resources Terraform manages; acceptable for a personal project.
# Replace with fine-grained roles if needed.
resource "google_project_iam_member" "terraform_runner_owner" {
  project = var.project_id
  role    = "roles/owner"
  member  = "serviceAccount:${google_service_account.terraform_runner.email}"
}

# Allow GitHub Actions to impersonate the terraform runner SA
resource "google_service_account_iam_member" "github_wif_terraform" {
  service_account_id = google_service_account.terraform_runner.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_owner}/${var.github_repo}"
}
