/* eslint-disable @next/next/no-img-element */
'use client'

import { LiveImageProvider } from '@/components/LiveImageProvider'
import { LiveImageShape, LiveImageShapeUtil } from '@/components/LiveImageShapeUtil'
import { MakeLiveButton } from '@/components/LiveImageTool'
import { FAL_APP_ID } from '@/lib/constants'
import { onEditorMount, overrides, shapeUtils, tools } from '@/lib/editor-config'
import { initFalClient } from '@/lib/fal-client'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
	AssetRecordType,
	Tldraw,
	track,
	useEditor,
} from 'tldraw'

initFalClient()

export default function Home() {
	return (
		<LiveImageProvider appId={FAL_APP_ID}>
			<main className="tldraw-wrapper">
				<div className="tldraw-wrapper__inner">
					<Tldraw
						persistenceKey="draw-fast"
						onMount={onEditorMount}
						shapeUtils={shapeUtils}
						tools={tools}
						components={{
							SharePanel: MakeLiveButton,
						}}
						overrides={overrides}
					>
						<SneakySideEffects />
						<LiveImageAssets />
					</Tldraw>
				</div>
			</main>
		</LiveImageProvider>
	)
}

function SneakySideEffects() {
	const editor = useEditor()

	useEffect(() => {
		editor.sideEffects.registerAfterChangeHandler('shape', () => {
			editor.emit('update-drawings' as any)
		})
		editor.sideEffects.registerAfterCreateHandler('shape', () => {
			editor.emit('update-drawings' as any)
		})
		editor.sideEffects.registerAfterDeleteHandler('shape', () => {
			editor.emit('update-drawings' as any)
		})
	}, [editor])

	return null
}

const LiveImageAssets = track(function LiveImageAssets() {
	const editor = useEditor()

	return (
		<Inject selector=".tl-overlays .tl-html-layer">
			{editor
				.getCurrentPageShapes()
				.filter((shape): shape is LiveImageShape => shape.type === 'live-image')
				.map((shape) => (
					<LiveImageAsset key={shape.id} shape={shape} />
				))}
		</Inject>
	)
})

const LiveImageAsset = track(function LiveImageAsset({ shape }: { shape: LiveImageShape }) {
	const editor = useEditor()

	if (!shape.props.overlayResult) return null

	const transform = editor.getShapePageTransform(shape).toCssString()
	const assetId = AssetRecordType.createId(shape.id.split(':')[1])
	const asset = editor.getAsset(assetId)
	return (
		asset &&
		asset.props.src && (
			<img
				src={asset.props.src!}
				alt={shape.props.name}
				width={shape.props.w}
				height={shape.props.h}
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					width: shape.props.w,
					height: shape.props.h,
					maxWidth: 'none',
					transform,
					transformOrigin: 'top left',
					opacity: shape.opacity,
				}}
			/>
		)
	)
})

function Inject({ children, selector }: { children: React.ReactNode; selector: string }) {
	const [parent, setParent] = useState<Element | null>(null)
	const target = useMemo(() => parent?.querySelector(selector) ?? null, [parent, selector])

	return (
		<>
			<div ref={(el) => setParent(el?.parentElement ?? null)} style={{ display: 'none' }} />
			{target && createPortal(children, target)}
		</>
	)
}
