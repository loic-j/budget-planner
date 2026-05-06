variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-northeast1"
}

variable "service_name" {
  description = "Cloud Run service name"
  type        = string
  default     = "budget-planner"
}

variable "github_owner" {
  description = "GitHub username or organization"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name (without owner)"
  type        = string
}

variable "app_url" {
  description = "Production URL (e.g. https://budget-planner-xxxx-an.a.run.app). Leave empty on first apply, update after first deploy."
  type        = string
  default     = ""
}
