"use client";

import React from "react";
import { ProductSpotlight, type ProductSpotlightProps } from "./ProductSpotlight";

export type AIResultInspectorProps = ProductSpotlightProps;

/**
 * AIResultInspector — Wrapped proxy to ProductSpotlight.
 * Maintains API compatibility while using the new 21st.dev Product Spotlight surface.
 */
export function AIResultInspector(props: AIResultInspectorProps) {
  return <ProductSpotlight {...props} />;
}
