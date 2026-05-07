provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "cloudflare_record" "budget_planner" {
  zone_id = var.cloudflare_zone_id
  name    = var.service_name
  type    = "CNAME"
  value   = "ghs.googlehosted.com"
  proxied = true
}

resource "google_cloud_run_domain_mapping" "app" {
  location = var.region
  name     = "${var.service_name}.loicj.org"

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.app.name
  }
}
