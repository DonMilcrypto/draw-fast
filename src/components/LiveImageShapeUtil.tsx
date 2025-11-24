/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/rules-of-hooks */
import {
	AssetRecordType,
	Geometry2d,
	getDefaultColorTheme,
	Rectangle2d,
	resizeBox,
	ShapeUtil,
	SVGContainer,
	TLBaseShape,
	TldrawUiButton,
	TldrawUiButtonIcon,
	TLGroupShape,
	TLResizeInfo,
	TLShape,
	TLShapeId,
	toDomPrecision,
	useEditor,
	useIsDarkMode,
} from 'tldraw'

import { useLiveImage } from '@/hooks/useLiveImage'
import {
	DEFAULT_H,
	DEFAULT_PROMPT_SUFFIX,
	DEFAULT_SEED,
	DEFAULT_STRENGTH,
	DEFAULT_W,
} from '@/lib/constants'
import { FrameHeading } from './FrameHeading'
import { LiveImageSettings } from './LiveImageSettings'

export type LiveImageShape = TLBaseShape<
	'live-image',
	{
		w: number
		h: number
		name: string
		overlayResult?: boolean
		strength?: number
		seed?: number
		promptSuffix?: string
	}
>

export class LiveImageShapeUtil extends ShapeUtil<LiveImageShape> {
	static type = 'live-image' as any

	override canBind = () => false
	override canEdit = () => true
	override isAspectRatioLocked = () => true

	getDefaultProps() {
		return {
			w: DEFAULT_W,
			h: DEFAULT_H,
			name: '',
			strength: DEFAULT_STRENGTH,
			seed: DEFAULT_SEED,
			promptSuffix: DEFAULT_PROMPT_SUFFIX,
		}
	}

	override getGeometry(shape: LiveImageShape): Geometry2d {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: false,
		})
	}

	override canReceiveNewChildrenOfType = (shape: TLShape, _type: TLShape['type']) => {
		return !shape.isLocked
	}

	providesBackgroundForChildren(): boolean {
		return true
	}

	override canDropShapes = (shape: LiveImageShape, _shapes: TLShape[]): boolean => {
		return !shape.isLocked
	}

	override onDragShapesOver = (
		frame: LiveImageShape,
		shapes: TLShape[]
	): { shouldHint: boolean } => {
		if (!shapes.every((child) => child.parentId === frame.id)) {
			this.editor.reparentShapes(
				shapes.map((shape) => shape.id),
				frame.id
			)
			return { shouldHint: true }
		}
		return { shouldHint: false }
	}

	override onDragShapesOut = (_shape: LiveImageShape, shapes: TLShape[]): void => {
		const parent = this.editor.getShape(_shape.parentId)
		const isInGroup = parent && this.editor.isShapeOfType<TLGroupShape>(parent, 'group')
		if (isInGroup) {
			this.editor.reparentShapes(shapes, parent.id)
		} else {
			this.editor.reparentShapes(shapes, this.editor.getCurrentPageId())
		}
	}

	override onResizeEnd(shape: LiveImageShape) {
		const bounds = this.editor.getShapePageBounds(shape)!
		const children = this.editor.getSortedChildIdsForParent(shape.id)

		const shapesToReparent: TLShapeId[] = []

		for (const childId of children) {
			const childBounds = this.editor.getShapePageBounds(childId)!
			if (!bounds.includes(childBounds)) {
				shapesToReparent.push(childId)
			}
		}

		if (shapesToReparent.length > 0) {
			this.editor.reparentShapes(shapesToReparent, this.editor.getCurrentPageId())
		}
	}

	override onResize(shape: LiveImageShape, info: TLResizeInfo<LiveImageShape>) {
		return resizeBox(shape, info)
	}

	indicator(shape: LiveImageShape) {
		const bounds = this.editor.getShapeGeometry(shape).bounds

		return (
			<rect
				width={toDomPrecision(bounds.width)}
				height={toDomPrecision(bounds.height)}
				className={`tl-frame-indicator`}
			/>
		)
	}

	override component(shape: LiveImageShape) {
		const editor = useEditor()
		const isSelected = editor.getSelectedShapeIds().includes(shape.id)

		const { isLoading, error } = useLiveImage(shape.id)

		const bounds = this.editor.getShapeGeometry(shape).bounds
		const assetId = AssetRecordType.createId(shape.id.split(':')[1])
		const asset = editor.getAsset(assetId)

		const theme = getDefaultColorTheme({ isDarkMode: useIsDarkMode() })

		return (
			<>
				<SVGContainer>
					<rect
						className={'tl-frame__body'}
						width={bounds.width}
						height={bounds.height}
						fill={theme.solid}
						stroke={theme.text}
					/>
				</SVGContainer>
				<FrameHeading
					id={shape.id}
					name={shape.props.name}
					width={bounds.width}
					height={bounds.height}
				/>
				{!shape.props.overlayResult && asset && asset.props.src && (
					<img
						src={asset.props.src!}
						alt={shape.props.name}
						width={shape.props.w}
						height={shape.props.h}
						style={{
							position: 'relative',
							left: shape.props.w,
							width: shape.props.w,
							height: shape.props.h,
						}}
					/>
				)}
				{/* Loading Overlay */}
				{isLoading && (
					<div
						style={{
							position: 'absolute',
							top: 0,
							left: shape.props.overlayResult ? 0 : shape.props.w,
							width: shape.props.w,
							height: shape.props.h,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: 'rgba(0,0,0,0.2)',
							pointerEvents: 'none',
						}}
					>
						<div className="tl-loading-spinner" style={{ width: 24, height: 24, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
						<style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
					</div>
				)}
				{/* Error Toast */}
				{error && (
					<div
						style={{
							position: 'absolute',
							bottom: 8,
							left: shape.props.overlayResult ? 0 : shape.props.w,
							width: shape.props.w,
							display: 'flex',
							justifyContent: 'center',
							pointerEvents: 'none',
						}}
					>
						<div style={{
							backgroundColor: 'var(--color-error)',
							color: 'white',
							padding: '4px 8px',
							borderRadius: 4,
							fontSize: 12,
						}}>
							{error.message}
						</div>
					</div>
				)}

				{/* Controls */}
				<TldrawUiButton
					type="icon"
					style={{
						position: 'absolute',
						top: -4,
						left: shape.props.overlayResult ? shape.props.w : shape.props.w * 2,
						pointerEvents: 'auto',
						transform: 'scale(var(--tl-scale))',
						transformOrigin: '0 4px',
					}}
					onPointerDown={(e) => {
						e.stopPropagation()
					}}
					onClick={(e) => {
						editor.updateShape<LiveImageShape>({
							id: shape.id,
							type: 'live-image',
							props: { overlayResult: !shape.props.overlayResult },
						})
					}}
				>
					<TldrawUiButtonIcon icon={shape.props.overlayResult ? 'chevron-right' : 'chevron-left'} />
				</TldrawUiButton>

				{/* Settings Panel - Only show when selected */}
				{isSelected && <LiveImageSettings shape={shape} />}
			</>
		)
	}
}
