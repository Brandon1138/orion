'use client';

import { useState, useRef, useEffect } from 'react';

type ComposerProps = {
	onSend: (
		text: string,
		options?: { dryRun?: boolean; useAgent?: boolean; approveLow?: boolean }
	) => void;
	disabled?: boolean;
};

export function Composer({ onSend, disabled }: ComposerProps) {
	const [text, setText] = useState('');
	const [useAgent, setUseAgent] = useState(true);
	const [approveLow, setApproveLow] = useState(true);
	const [showOptions, setShowOptions] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!text.trim() || disabled) return;
		onSend(text, { dryRun: false, useAgent, approveLow });
		setText('');
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			handleSubmit(e);
		}
	}

	// Auto-resize textarea
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
		}
	}, [text]);

	return (
		<div className="space-y-4">
			{/* Options panel */}
			{showOptions && (
				<div className="bg-surface border border-border rounded-xl p-3 sm:p-4 animate-slide-up">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
						<div className="flex items-center gap-2">
							<ToggleSwitch
								checked={useAgent}
								onChange={setUseAgent}
								disabled={disabled}
								label="Use Agent"
								description="Enable AI agent capabilities"
							/>
						</div>
						<div className="flex items-center gap-2">
							<ToggleSwitch
								checked={approveLow}
								onChange={setApproveLow}
								disabled={disabled}
								label="Auto-approve low risk"
								description="Automatically approve low-risk operations"
							/>
						</div>
					</div>
				</div>
			)}

			{/* Main composer */}
			<form onSubmit={handleSubmit} className="relative">
				<div className="relative">
					{/* Text input */}
					<textarea
						ref={textareaRef}
						value={text}
						onChange={e => setText(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Message Orion... (⌘ + Enter to send)"
						disabled={disabled}
						rows={1}
						className="w-full resize-none rounded-2xl bg-surface border border-border pl-4 pr-24 sm:pr-32 py-3 sm:py-4 text-sm text-foreground placeholder:text-foreground-muted focus-ring-subtle focus:border-transparent transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed max-h-32 overflow-y-auto scrollbar-custom"
					/>
					
					{/* Action buttons */}
					<div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
						{/* Options toggle */}
						<button
							type="button"
							onClick={() => setShowOptions(!showOptions)}
							disabled={disabled}
							className={`interactive-subtle rounded-lg px-2 py-2 h-8 w-8 flex items-center justify-center focus-ring-subtle ${
								showOptions 
									? 'bg-surface-elevated text-foreground shadow-soft' 
									: 'text-foreground-muted hover:text-foreground hover:bg-surface-elevated'
							}`}
							title="Toggle options"
						>
							<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
							</svg>
						</button>
						
						{/* Dry run button */}
						<button
							type="button"
							onClick={() =>
								text.trim() && !disabled && onSend(text, { dryRun: true, useAgent, approveLow })
							}
							disabled={!text.trim() || disabled}
							className="interactive-subtle rounded-lg px-3 py-2 h-8 flex items-center text-xs font-medium bg-surface-elevated text-foreground-secondary hover:text-foreground hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed focus-ring-subtle"
							title="Test without executing"
						>
							Test
						</button>
						
						{/* Send button */}
						<button
							type="submit"
							disabled={!text.trim() || disabled}
							className="interactive rounded-lg px-4 py-2 h-8 flex items-center text-sm font-medium gradient-primary text-white shadow-soft hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
							title="Send message (⌘ + Enter)"
						>
							<div className="flex items-center gap-1.5">
								<span>Send</span>
								<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
								</svg>
							</div>
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}

type ToggleSwitchProps = {
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
	label: string;
	description?: string;
};

function ToggleSwitch({ checked, onChange, disabled, label, description }: ToggleSwitchProps) {
	return (
		<div className="flex items-center gap-3">
			<button
				type="button"
				onClick={() => onChange(!checked)}
				disabled={disabled}
				className={`
					relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ease-out focus-ring-subtle
					${checked 
						? 'bg-gradient-primary shadow-glow' 
						: 'bg-surface-elevated border border-border'
					}
					${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
				`}
			>
				<span
					className={`
						inline-block h-3 w-3 transform rounded-full transition-all duration-300 ease-out
						${checked 
							? 'translate-x-5 bg-white shadow-soft' 
							: 'translate-x-1 bg-foreground-muted'
						}
					`}
				/>
			</button>
			<div className="flex flex-col">
				<span className="text-sm font-medium text-foreground">{label}</span>
				{description && (
					<span className="text-xs text-foreground-muted">{description}</span>
				)}
			</div>
		</div>
	);
}
