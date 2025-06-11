"use client"
export const dynamic = "force-dynamic";
import React, { Suspense } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MapPin, Diff, BarChart2 } from "lucide-react"

function InfoContent() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-12">
            <div className="w-full max-w-4xl bg-card text-card-foreground border border-border rounded-2xl shadow-lg p-8 space-y-8">
                <div className="flex flex-col items-center">
                    <img src="/mascot-blue.svg" alt="Queryous Mascot" className="w-24 h-24 mb-4 bg-primary p-2 rounded-full" />
                    <h1 className="text-3xl font-bold text-primary mb-2 text-center">Welcome to Are-u-Queryous?</h1>
                    <p className="text-lg text-muted-foreground text-center max-w-xl">
                        Your friendly geospatial explorer!
                        Here you can dive into city data, compare areas, and visualize trends—all with a pinch of fun and curiosity.
                    </p>
                    <p className="text-xl text-muted-foreground text-center max-w-xl mt-2">
                        Let us show you around!
                    </p>
                </div>

                <section className="modern-card">
                    <h2 className="section-title flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Map View: Explore & Discover
                    </h2>
                    <ul className="list-disc pl-6 space-y-1 text-base">
                        <li><b>Pan & Zoom:</b> Move around the map and zoom in to your favorite spots.</li>
                        <li><b>Filters:</b> Use the top menu to filter by city and level (districts, neighborhoods, etc).</li>
                        <li><b>Points of Interest:</b> Click on colorful points to see detailed info in a stylish popup.</li>
                        <li><b>Info at a Glance:</b> Hover or tap to get quick facts—no boring tables here!</li>
                    </ul>
                </section>

                <section className="modern-card">
                    <h2 className="section-title flex items-center gap-2">
                        <Diff className="h-5 w-5" />
                        Compare View: Spot the Differences
                    </h2>
                    <ul className="list-disc pl-6 space-y-1 text-base">
                        <li><b>Side-by-Side:</b> Compare two areas or indicators to see how they stack up.</li>
                        <li><b>Visual Highlights:</b> Colorful cards and charts make differences pop!</li>
                        <li><b>Easy Switching:</b> Change your selections anytime—curiosity never sleeps.</li>
                    </ul>
                </section>

                <section className="modern-card">
                    <h2 className="section-title flex items-center gap-2">
                        <BarChart2 className="h-5 w-5" />
                        Visualize View: See the Big Picture
                    </h2>
                    <ul className="list-disc pl-6 space-y-1 text-base">
                        <li><b>Trendy Charts:</b> Bar charts and more help you spot trends at a glance.</li>
                        <li><b>Top Rankings:</b> See which areas lead the pack for any indicator.</li>
                    </ul>
                </section>

                <section className="modern-card">
                    <h2 className="section-title">General Features</h2>
                    <ul className="list-disc pl-6 space-y-1 text-base">
                        <li><b>Dark Mode Ready:</b> All visuals look great day or night—just like you!</li>
                        <li><b>Sign In to Personalize:</b> Sign in to configure what to display and personalize your experience.</li>
                    </ul>
                </section>

                <div className="flex flex-col items-center space-y-2">
                    <p className="text-base text-muted-foreground text-center">
                        <b>Are-u-Queryous?</b> is all about making data fun, friendly, and easy to explore.
                        <br />
                        Whether you're a data nerd or just a little curious, we've got you covered!
                    </p>
                    <Link href="/">
                        <Button variant="default" className="mt-2">Back to Home</Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default function InfoPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        }>
            <InfoContent />
        </Suspense>
    )
} 