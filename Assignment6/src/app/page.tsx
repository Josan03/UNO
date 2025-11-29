import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 via-green-800 to-green-900">
      <main className="flex flex-col items-center justify-center gap-8 p-8">
        <h1 className="text-7xl font-bold text-white tracking-wider drop-shadow-2xl">
          UNO
        </h1>
        <p className="text-2xl text-white/90 text-center max-w-2xl">
          The classic card game - Now with Next.js SSR!
        </p>
        <div className="flex flex-col gap-4 mt-8">
          <Link
            href="/lobby"
            className="px-8 py-4 text-xl font-semibold text-green-900 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
          >
            Start New Game
          </Link>
        </div>
        <div className="mt-12 text-white/70 text-center">
          <p className="text-sm">Assignment 6 - Next.js SSR Implementation</p>
          <p className="text-xs mt-1">Built with functional programming & immutability</p>
        </div>
      </main>
    </div>
  )
}
