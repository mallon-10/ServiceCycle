"use client";

import dynamic from "next/dynamic";
import type { MapCustomer } from "./operations-map";

const OperationsMap = dynamic(
  () => import("./operations-map").then((m) => m.OperationsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[600px] w-full items-center justify-center rounded-lg border border-border text-sm text-muted-foreground">
        Carregando mapa...
      </div>
    ),
  }
);

export function OperationsMapLoader({ customers }: { customers: MapCustomer[] }) {
  return <OperationsMap customers={customers} />;
}
