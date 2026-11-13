import React from "react";
import { RegionDetailClient } from "./RegionDetailClient";

export const metadata = {
  title: "Detail Wilayah Agroklimat - AgroEWS",
};

export default function RegionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <RegionDetailClient params={params} />;
}
