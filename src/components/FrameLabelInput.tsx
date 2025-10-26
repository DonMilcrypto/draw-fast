import { TLFrameShape, TLShapeId, stopEventPropagation, useEditor } from '@tldraw/editor'
import { forwardRef, useCallback } from 'react'

export const FrameLabelInput = forwardRef<
	HTMLInputElement,
	{ id: TLShapeId; name: string; isEditing: boolean; placeholder?: string }
>(function FrameLabelInput({ id, name, isEditing, placeholder }, ref) {
	const editor = useEditor()

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
				// need to prevent the enter keydown making it's way up to the Idle state
				// and sending us back into edit mode
				stopEventPropagation(e)
				e.currentTarget.blur()
				editor.setEditingShape(null)
			}
		},
		[editor]
	)

	const handleBlur = useCallback(
		(e: React.FocusEvent<HTMLInputElement>) => {
			const shape = editor.getShape<TLFrameShape>(id)
			if (!shape) return

			const value = e.currentTarget.value.trim()
			const prop = placeholder ? 'negative_prompt' : 'name'
			if (shape.props[prop] === value) return

			editor.updateShapes([
				{
					id,
					type: 'frame',
					props: { [prop]: value },
				},
			])
		},
		[id, editor, placeholder]
	)

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const shape = editor.getShape<TLFrameShape>(id)
			if (!shape) return

			const value = e.currentTarget.value
			const prop = placeholder ? 'negative_prompt' : 'name'
			if (shape.props[prop] === value) return

			editor.updateShapes([
				{
					id,
					type: 'frame',
					props: { [prop]: value },
				},
			])
		},
		[id, editor, placeholder]
	)

	return (
		<div className={`tl-frame-label ${isEditing ? 'tl-frame-label__editing' : ''}`}>
			<input
				className="tl-frame-name-input"
				ref={ref}
				style={{ display: isEditing ? undefined : 'none' }}
				value={name}
				placeholder={placeholder}
				autoFocus
				onKeyDown={handleKeyDown}
				onBlur={handleBlur}
				onChange={handleChange}
				onPointerDown={stopEventPropagation}
			/>
			{defaultEmptyAs(name, placeholder ?? 'Double click prompt to edit') +
				String.fromCharCode(8203)}
		</div>
	)
})

export function defaultEmptyAs(str: string, dflt: string) {
	if (str.match(/^\s*$/)) {
		return dflt
	}
	return str
}
