import React from "react";
import SharedChatDropdown, { type ChatTheme } from "@/components/shared/ChatDropdown";
import type { DeceptionPlayer, DeceptionChatMessage } from "@/server/game/DeceptionTypes";

interface SharedChatDropdownWrapperProps {
  me: DeceptionPlayer | undefined;
  visibleChatMessages: DeceptionChatMessage[];
  showChat: boolean;
  setShowChat: React.Dispatch<React.SetStateAction<boolean>>;
  chatText: string;
  setChatText: React.Dispatch<React.SetStateAction<string>>;
  DECEPTION_CHAT_THEME: ChatTheme;
  handleSendChat: (event: React.FormEvent) => void;
  canChat: boolean;
}

export default function SharedChatDropdownWrapper({
  me,
  visibleChatMessages,
  showChat,
  setShowChat,
  chatText,
  setChatText,
  DECEPTION_CHAT_THEME,
  handleSendChat,
  canChat,
}: SharedChatDropdownWrapperProps) {
  if (!me) return null;
  return (
    <SharedChatDropdown
      messages={visibleChatMessages}
      userId={me.userId}
      showChat={showChat}
      chatText={chatText}
      theme={DECEPTION_CHAT_THEME}
      onToggleChat={() => setShowChat((prev: boolean) => !prev)}
      onCloseChat={() => setShowChat(false)}
      onChatTextChange={(value: string) => setChatText(value.slice(0, 500))}
      onSendChat={handleSendChat}
      canSend={canChat}
      sendBlockedMessage="Pháp y không được chat trong ván chơi."
    />
  );
}
