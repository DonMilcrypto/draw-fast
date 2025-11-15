'use client'

import dynamic from 'next/dynamic'

const ClientOnlyEditor = dynamic(
	() => import('@/components/ClientOnlyEditor').then((mod) => mod.ClientOnlyEditor),
	{
		ssr: false,
	}
)

export default function Home() {
	return (
		<main className="tldraw-wrapper">
			<div className="tldraw-wrapper__inner">
				<ClientOnlyEditor />
			</div>
		</main>
	)
}
