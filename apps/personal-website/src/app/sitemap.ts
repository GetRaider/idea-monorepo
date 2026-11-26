import type { MetadataRoute } from "next";

import { products } from "@/data/products";
import { SITE_URL } from "@/lib/format";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/experience", "/products", ...products.map((product) => `/products/${product.slug}`)];
  return routes.map((route) => ({ url: `${SITE_URL}${route}`, changeFrequency: "monthly" }));
}
