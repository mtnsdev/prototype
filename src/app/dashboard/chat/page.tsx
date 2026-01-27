import ChatPanel from "@/components/dashboard/ChatPanel";
import RightPlaceholder from "@/components/dashboard/RightPlaceHolder";

export default function ChatPage() {
    return (
        <div className="h-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
                {/* LEFT: chat column (1/3 of remaining space) */}
                <div className="lg:col-span-1 border-r border-white/10">
                    <div className="h-full">
                        <ChatPanel />
                    </div>
                </div>

                {/* RIGHT: placeholder (2/3 of remaining space) */}
                <div className="lg:col-span-2">
                    <RightPlaceholder />
                </div>
            </div>
        </div>
    );
}
