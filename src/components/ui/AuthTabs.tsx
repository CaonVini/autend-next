type AuthTabsProps = {
  activeTab: "login" | "register";
  onChange: (tab: "login" | "register") => void;
};

const tabs = [
  { id: "login" as const, label: "Entrar" },
  { id: "register" as const, label: "Criar conta" },
];

export function AuthTabs({ activeTab, onChange }: AuthTabsProps) {
  return (
    <div className="grid grid-cols-2 rounded-2xl bg-[#efefee] p-1.5">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={[
              "rounded-xl px-4 py-3 text-sm font-medium",
              isActive
                ? "bg-white text-[#07140a] shadow-[0_1px_2px_rgba(7,20,10,0.14)]"
                : "text-[#818b83] hover:text-[#07140a]",
            ].join(" ")}
            aria-pressed={isActive}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
