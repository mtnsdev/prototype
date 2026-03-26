import { FileText } from "lucide-react";

export default function RightPlaceholder() {
    return (
        <section className="h-screen flex items-center justify-center bg-[#0C0C0C]">
            <div className="w-[85%] h-[85%] rounded-2xl border-2 border-dashed border-[rgba(255,255,255,0.1)] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.04)] flex items-center justify-center">
                    <FileText size={28} className="text-[rgba(245,245,245,0.25)]" />
                </div>
                <p className="text-[rgba(245,245,245,0.35)] text-[18px] font-medium">
                    Document Preview
                </p>
                <p className="text-[rgba(245,245,245,0.25)] text-[13px] max-w-xs text-center">
                    Click on a citation to preview the source document here
                </p>
            </div>
        </section>
    );
}
