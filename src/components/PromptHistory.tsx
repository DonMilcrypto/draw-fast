import { FC } from 'react'
import './PromptHistory.css'

export const PromptHistory: FC<{
	prompts: string[]
	onSelectPrompt: (prompt: string) => void
}> = ({ prompts, onSelectPrompt }) => {
	return (
		<div className="prompt-history">
			<h2>Prompt History</h2>
			<ul>
				{prompts.map((prompt) => (
					<li key={prompt} onClick={() => onSelectPrompt(prompt)}>
						{prompt}
					</li>
				))}
			</ul>
		</div>
	)
}
