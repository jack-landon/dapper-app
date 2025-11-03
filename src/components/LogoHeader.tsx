import { Icon } from "lucide-react";
import { mustache } from "@lucide/lab";

export default function LogoHeader() {
  return (
    <div className="flex items-center gap-2 mb-8">
      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center glow-effect">
        <Icon iconNode={mustache} className="w-7 h-7 text-primary-foreground" />
      </div>
      <span className="text-3xl font-bold tracking-tight">Dapper</span>
    </div>
  );
}
