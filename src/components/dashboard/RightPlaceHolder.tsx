import { FileText } from "lucide-react";

export default function RightPlaceholder() {
    return (
        <section className="h-screen flex items-center justify-center bg-background">
            <div className="w-[85%] h-[85%] rounded-2xl border-2 border-dashed border-input flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.04)] flex items-center justify-center">
                    <FileText size={28} className="text-muted-foreground/55" />
                </div>
                <p className="text-muted-foreground/55 text-lg font-medium">
                    Document Preview
                </p>
                <p className="text-muted-foreground/55 text-compact max-w-xs text-center">
                    Click on a citation to preview the source document here
                </p>
            </div>
        </section>
    );
}
