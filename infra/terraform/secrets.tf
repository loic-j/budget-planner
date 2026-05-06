resource "google_secret_manager_secret" "database_url" {
  secret_id = "DATABASE_URL"
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret" "better_auth_secret" {
  secret_id = "BETTER_AUTH_SECRET"
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret" "cf_secret" {
  secret_id = "CF_SECRET"
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}

# Grant Cloud Run runtime SA access to secrets
resource "google_secret_manager_secret_iam_member" "runtime_database_url" {
  secret_id = google_secret_manager_secret.database_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloudrun_runtime.email}"
}

resource "google_secret_manager_secret_iam_member" "runtime_better_auth_secret" {
  secret_id = google_secret_manager_secret.better_auth_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloudrun_runtime.email}"
}

resource "google_secret_manager_secret_iam_member" "runtime_cf_secret" {
  secret_id = google_secret_manager_secret.cf_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloudrun_runtime.email}"
}
