import ChatPanel from "@/components/dashboard/ChatPanel";
import RightPlaceholder from "@/components/dashboard/RightPlaceHolder";

export default function ChatPage() {
    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 min-h-0 overflow-hidden">
                {/* LEFT: chat column (1/3 of remaining space) */}
                <div className="lg:col-span-2 border-r border-white/10 flex flex-col overflow-hidden">
                    <ChatPanel />
                </div>

                {/* RIGHT: placeholder (2/3 of remaining space) */}
                <div className="lg:col-span-1 overflow-hidden">
                    <RightPlaceholder />
                </div>
            </div>
        </div>
    );
}
