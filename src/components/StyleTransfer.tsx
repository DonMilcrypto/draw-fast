import { FC, useState } from 'react'

export const StyleTransfer: FC<{
	onStyleChange: (style_prompt: string, style_image_url: string | null) => void
}> = ({ onStyleChange }) => {
	const [stylePrompt, setStylePrompt] = useState('')
	const [styleImageUrl, setStyleImageUrl] = useState<string | null>(null)

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onloadend = () => {
				setStyleImageUrl(reader.result as string)
			}
			reader.readAsDataURL(file)
		}
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		onStyleChange(stylePrompt, styleImageUrl)
	}

	return (
		<form onSubmit={handleSubmit}>
			<label>
				Style Prompt:
				<input
					type="text"
					value={stylePrompt}
					onChange={(e) => setStylePrompt(e.target.value)}
				/>
			</label>
			<label>
				Style Image:
				<input type="file" onChange={handleFileChange} />
			</label>
			<button type="submit">Apply Style</button>
		</form>
	)
}
