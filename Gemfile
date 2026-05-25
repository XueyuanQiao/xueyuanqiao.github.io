source "https://gems.ruby-china.org"

# Hello! This is where you manage which Jekyll version is used to run.
# When you want to use a different version, change it below, save the
# file and run `bundle install`. Run Jekyll with `bundle exec`, like so:
#
#     bundle exec jekyll serve
#
# This will help ensure the proper Jekyll version is running.

gem "jekyll", "~> 4.3"

# Default theme replaced by the custom Aurora theme; minima kept only as a
# fallback to satisfy any plugin metadata that still references it.
gem "minima", "~> 2.5"

# Plugins
group :jekyll_plugins do
  gem "jekyll-feed",     "~> 0.17"
  gem "jekyll-paginate", "~> 1.1"
  gem "jekyll-sitemap",  "~> 1.4"
  gem "jekyll-seo-tag",  "~> 2.8"
end

# --- Security pins ---------------------------------------------------------
# Pin transitive deps that have known CVEs in older versions. Bundler will
# resolve to the newest patch satisfying both the constraint here and the
# upstream gem's own requirement.
gem "rexml",         ">= 3.3.9"   # CVE-2024-39908 / 41946 / 43398 / 49761
gem "addressable",   ">= 2.8.7"   # CVE-2023-28154 family
gem "public_suffix", ">= 5.1.1"

# Windows does not include zoneinfo files
gem "tzinfo-data", platforms: [:mingw, :mswin, :x64_mingw, :jruby]
