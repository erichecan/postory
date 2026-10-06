import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { VisualHeader } from "@/components/visual/shell";
export function PublicHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="ps ps-chrome">
      <VisualHeader signedIn={signedIn} localeControl={<LocaleSwitcher />} />
    </div>
  );
}
