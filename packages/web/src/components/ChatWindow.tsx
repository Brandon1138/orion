'use client';

import { Composer } from './Composer';
import { MessageList } from './MessageList';
import { useChatContext } from '@/lib/chat-context';
import { ApprovalModal } from './modals/ApprovalModal';

export function ChatWindow() {
	const { messages, sendMessage, isSending, pendingApproval, resolveApproval, sessionId } =
		useChatContext();
	return (
		<div className="flex h-full flex-col">
			<MessageList messages={messages} />
			<div className="mt-3">
				<Composer onSend={sendMessage} disabled={isSending} />
			</div>
			<ApprovalModal
				open={!!pendingApproval}
				approvalId={pendingApproval?.approvalId}
				tool={pendingApproval?.tool}
				risk={pendingApproval?.risk}
				onDecision={approve =>
					pendingApproval?.approvalId && resolveApproval(pendingApproval.approvalId, approve)
				}
			/>
		</div>
	);
}
