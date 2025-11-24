import { LiveImageContext } from '@/components/LiveImageProvider'
import { LiveImageShape } from '@/components/LiveImageShapeUtil'
import { fastGetSvgAsImage } from '@/utils/screenshot'
import { useContext, useEffect, useRef, useState } from 'react'
import {
	AssetRecordType,
	Editor,
	FileHelpers,
	TLShape,
	TLShapeId,
	getHashForObject,
	useEditor,
} from 'tldraw'

export function useLiveImage(
	shapeId: TLShapeId,
	{ throttleTime = 64 }: { throttleTime?: number } = {}
) {
	const editor = useEditor()
	const fetchImage = useContext(LiveImageContext)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	// Use a ref to track if we are currently generating to avoid state updates on unmounted components
	const isMounted = useRef(true)

	useEffect(() => {
		return () => {
			isMounted.current = false
		}
	}, [])

	if (!fetchImage) throw new Error('Missing LiveImageProvider')

	useEffect(() => {
		let prevHash = ''
		let prevPrompt = ''

		let startedIteration = 0
		let finishedIteration = 0

		async function updateDrawing() {
			const shapes = getShapesTouching(shapeId, editor)
			const frame = editor.getShape<LiveImageShape>(shapeId)!

			const hash = getHashForObject([...shapes])
			const frameName = frame.props.name

			// Check if anything changed
			if (hash === prevHash && frameName === prevPrompt) return

			startedIteration += 1
			const iteration = startedIteration

			prevHash = hash
			prevPrompt = frame.props.name

			if (isMounted.current) setIsLoading(true)
			if (isMounted.current) setError(null)

			try {
				const svgStringResult = await editor.getSvgString([...shapes], {
					background: true,
					padding: 0,
					darkMode: editor.user.getIsDarkMode(),
					bounds: editor.getShapePageBounds(shapeId)!,
					scale: 512 / frame.props.w,
				})

				if (!svgStringResult) {
					console.warn('No SVG')
					updateImage(editor, frame.id, null)
					if (isMounted.current) setIsLoading(false)
					return
				}

				const svgString = svgStringResult.svg

				// cancel if stale:
				if (iteration <= finishedIteration) return

				const blob = await fastGetSvgAsImage(svgString, {
					type: 'jpeg',
					quality: 0.5,
					width: svgStringResult.width,
					height: svgStringResult.height,
				})

				if (iteration <= finishedIteration) return

				if (!blob) {
					console.warn('No Blob')
					updateImage(editor, frame.id, null)
					if (isMounted.current) setIsLoading(false)
					return
				}

				const imageUrl = await FileHelpers.blobToDataUrl(blob)

				// cancel if stale:
				if (iteration <= finishedIteration) return

				// Use props from the shape or defaults
				// We need to update LiveImageShape to include these props later
				const prompt = frameName
					? frameName + (frame.props.promptSuffix ?? ' hd award-winning impressive')
					: 'A random image that is safe for work and not surprising—something boring like a city or shoe watercolor'

				const result = await fetchImage!({
					prompt,
					image_url: imageUrl,
					sync_mode: true,
					strength: frame.props.strength ?? 0.65,
					seed: frame.props.seed ?? 42,
					enable_safety_checks: false,
				})

				// cancel if stale:
				if (iteration <= finishedIteration) return

				finishedIteration = iteration
				updateImage(editor, frame.id, result.url)
				if (isMounted.current) setIsLoading(false)
			} catch (e) {
				const isTimeout = e instanceof Error && e.message === 'Timeout'
				if (!isTimeout) {
					console.error(e)
					if (isMounted.current) setError(e instanceof Error ? e : new Error('Unknown error'))
				}

				// retry if this was the most recent request:
				if (iteration === startedIteration) {
					requestUpdate()
				}
				if (isMounted.current) setIsLoading(false)
			}
		}

		let timer: ReturnType<typeof setTimeout> | null = null
		function requestUpdate() {
			if (timer !== null) return
			timer = setTimeout(() => {
				timer = null
				updateDrawing()
			}, throttleTime)
		}

		editor.on('update-drawings' as any, requestUpdate)
		return () => {
			editor.off('update-drawings' as any, requestUpdate)
		}
	}, [editor, fetchImage, shapeId, throttleTime])

	return { isLoading, error }
}

function updateImage(editor: Editor, shapeId: TLShapeId, url: string | null) {
	const shape = editor.getShape<LiveImageShape>(shapeId)
	if (!shape) {
		return
	}
	const id = AssetRecordType.createId(shape.id.split(':')[1])

	const asset = editor.getAsset(id)

	if (!asset) {
		editor.createAssets([
			AssetRecordType.create({
				id,
				type: 'image',
				props: {
					name: shape.props.name,
					w: shape.props.w,
					h: shape.props.h,
					src: url,
					isAnimated: false,
					mimeType: 'image/jpeg',
				},
			}),
		])
	} else {
		editor.updateAssets([
			{
				...asset,
				type: 'image',
				props: {
					...asset.props,
					w: shape.props.w,
					h: shape.props.h,
					src: url,
				},
			},
		])
	}
}

function getShapesTouching(shapeId: TLShapeId, editor: Editor) {
	const shapeIdsOnPage = editor.getCurrentPageShapeIds()
	const shapesTouching: TLShape[] = []
	const targetBounds = editor.getShapePageBounds(shapeId)
	if (!targetBounds) return shapesTouching
	for (const id of [...shapeIdsOnPage]) {
		if (id === shapeId) continue
		const bounds = editor.getShapePageBounds(id)!
		if (bounds.collides(targetBounds)) {
			shapesTouching.push(editor.getShape(id)!)
		}
	}
	return shapesTouching
}
