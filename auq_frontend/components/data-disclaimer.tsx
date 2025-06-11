"use client"

import { Separator } from "@/components/ui/separator"

export function DataDisclaimer() {
    return (
        <footer className="mt-8">
            <Separator className="mb-4" />
            <div className="text-sm text-muted-foreground text-center mb-7">
                <p>
                    This product uses public datasets from{" "}
                    <a
                        href="https://opendata-ajuntament.barcelona.cat/es"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        Open Data BCN
                    </a>{" "}
                    and the{" "}
                    <a
                        href="https://datos.madrid.es/portal/site/egob"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        Madrid City Open Data Portal
                    </a>, both licensed under the{" "}
                    <a
                        href="https://creativecommons.org/licenses/by/4.0/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        Creative Commons Attribution 4.0 (CC BY 4.0)
                    </a>.
                </p>

                <p className="text-xs mt-1">
                    <b>DISCLAIMER:</b> Data is collected at the neighborhood level. <b>Aggregated district-level information may be incomplete or imprecise</b> due to missing entries.
                </p>
                <p className="text-xs mt-1">
                    This application is not affiliated with or endorsed by the City Councils of Barcelona or Madrid.
                </p>

            </div>
        </footer>
    )
}
