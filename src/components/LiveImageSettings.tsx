import {
	DefaultColorStyle,
	Editor,
	HTMLContainer,
	TldrawUiButton,
	TldrawUiButtonIcon,
	TldrawUiInput,
	track,
	useEditor,
} from 'tldraw'
import { LiveImageShape } from './LiveImageShapeUtil'

export const LiveImageSettings = track(function LiveImageSettings({
	shape,
}: {
	shape: LiveImageShape
}) {
	const editor = useEditor()

	const handleChange = (partial: Partial<LiveImageShape['props']>) => {
		editor.updateShape<LiveImageShape>({
			id: shape.id,
			type: 'live-image',
			props: { ...shape.props, ...partial },
		})
	}

	return (
		<HTMLContainer className="tl-live-image-settings">
			<div
				style={{
					pointerEvents: 'all',
					position: 'absolute',
					top: 0,
					left: '100%', // Position to the right of the frame
					marginLeft: 12,
					display: 'flex',
					flexDirection: 'column',
					gap: 8,
					backgroundColor: 'var(--color-panel-header)',
					padding: 12,
					borderRadius: 8,
					boxShadow: 'var(--shadow-2)',
					border: '1px solid var(--color-panel-contrast)',
					width: 200,
				}}
				onPointerDown={(e) => e.stopPropagation()}
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
					<label style={{ fontSize: 12, fontWeight: 600 }}>Strength: {shape.props.strength ?? 0.65}</label>
					<input
						type="range"
						min={0}
						max={1}
						step={0.01}
						value={shape.props.strength ?? 0.65}
						onChange={(e) => handleChange({ strength: parseFloat(e.target.value) })}
						style={{ width: '100%' }}
					/>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
					<label style={{ fontSize: 12, fontWeight: 600 }}>Seed</label>
					<div style={{ display: 'flex', gap: 4 }}>
						<input
							type="number"
							value={shape.props.seed ?? 42}
							onChange={(e) => handleChange({ seed: parseInt(e.target.value) })}
							style={{
								flex: 1,
								padding: '4px 8px',
								borderRadius: 4,
								border: '1px solid var(--color-text-1)',
								background: 'var(--color-background)',
								color: 'var(--color-text)',
								fontSize: 12,
							}}
						/>
						<TldrawUiButton
							type="icon"
							onClick={() => handleChange({ seed: Math.floor(Math.random() * 100000) })}
							title="Randomize Seed"
						>
							<TldrawUiButtonIcon icon="refresh" />
						</TldrawUiButton>
					</div>
				</div>
			</div>
		</HTMLContainer>
	)
})
