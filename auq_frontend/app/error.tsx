"use client"
export const dynamic = 'force-dynamic';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <html>
            <body>
                <div className="min-h-screen flex flex-col items-center justify-center">
                    <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
                    <p className="mb-4 text-red-600">{error.message || "An unexpected error occurred."}</p>
                    <button
                        onClick={() => reset()}
                        className="bg-primary text-white px-4 py-2 rounded"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    )
} 