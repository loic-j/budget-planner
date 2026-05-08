provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "cloudflare_record" "budget_planner" {
  zone_id         = var.cloudflare_zone_id
  name            = var.service_name
  type            = "CNAME"
  content         = "ghs.googlehosted.com"
  proxied         = true
  allow_overwrite = true
}

# NOTE: google_cloud_run_domain_mapping is managed manually.
# Domain ownership verification is tied to the personal Google account
# (loic.jacquel@gmail.com), not the Terraform service account.
# To recreate: gcloud beta run domain-mappings create \
#   --service=budget-planner \
#   --domain=budget-planner.loicj.org \
#   --region=asia-northeast1
