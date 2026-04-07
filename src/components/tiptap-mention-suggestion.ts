import { api } from "@/lib/api";
import type { MentionOptions } from "@tiptap/extension-mention";

interface UserResult {
  id: string;
  username: string;
  name: string;
}

type SuggestionConfig = MentionOptions["suggestion"];

const suggestion: SuggestionConfig = {
  items: async ({ query }: { query: string }) => {
    if (!query || query.length < 1) return [];
    try {
      const data = await api<{ users: UserResult[] }>(
        `/users/search?q=${encodeURIComponent(query)}&limit=5`,
      );
      return data.users;
    } catch {
      return [];
    }
  },

  render: () => {
    let popup: HTMLDivElement | null = null;
    let selectedIndex = 0;
    let currentItems: UserResult[] = [];
    let currentCommand: ((props: { id: string; label: string }) => void) | null = null;

    function rebuild() {
      if (!popup) return;
      popup.innerHTML = "";
      if (currentItems.length === 0) {
        popup.style.display = "none";
        return;
      }
      popup.style.display = "";
      currentItems.forEach((user, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
          idx === selectedIndex ? "bg-accent/10" : ""
        }`;
        btn.onmouseenter = () => {
          selectedIndex = idx;
          rebuild();
        };
        const at = document.createElement("span");
        at.className = "font-medium text-accent";
        at.textContent = `@${user.username}`;
        const name = document.createElement("span");
        name.className = "text-muted";
        name.textContent = user.name;
        btn.appendChild(at);
        btn.appendChild(name);
        btn.addEventListener("mousedown", (e) => {
          e.preventDefault();
          currentCommand?.({ id: user.id, label: user.username });
        });
        popup!.appendChild(btn);
      });
    }

    return {
      onStart: (props: any) => {
        currentCommand = props.command;
        currentItems = props.items;
        selectedIndex = 0;

        popup = document.createElement("div");
        popup.className =
          "z-50 rounded-lg border border-border bg-background shadow-lg overflow-hidden";
        popup.style.position = "absolute";
        popup.style.minWidth = "200px";

        rebuild();

        // 에디터 커서 위치에 팝업 배치
        const { view } = props.editor;
        const coords = view.coordsAtPos(props.range.from);
        const container = view.dom.closest(".rounded-lg") as HTMLElement | null;
        if (container) {
          const rect = container.getBoundingClientRect();
          container.style.position = "relative";
          popup.style.left = `${coords.left - rect.left}px`;
          popup.style.top = `${coords.bottom - rect.top + 4}px`;
          container.appendChild(popup);
        }
      },

      onUpdate: (props: any) => {
        currentCommand = props.command;
        currentItems = props.items;
        selectedIndex = 0;

        if (!popup) return;

        rebuild();

        const { view } = props.editor;
        const coords = view.coordsAtPos(props.range.from);
        const container = view.dom.closest(".rounded-lg") as HTMLElement | null;
        if (container) {
          const rect = container.getBoundingClientRect();
          popup.style.left = `${coords.left - rect.left}px`;
          popup.style.top = `${coords.bottom - rect.top + 4}px`;
        }
      },

      onKeyDown: (props: any) => {
        const { event } = props;
        if (event.key === "ArrowDown") {
          selectedIndex = (selectedIndex + 1) % currentItems.length;
          rebuild();
          return true;
        }
        if (event.key === "ArrowUp") {
          selectedIndex =
            (selectedIndex - 1 + currentItems.length) % currentItems.length;
          rebuild();
          return true;
        }
        if (event.key === "Enter") {
          const user = currentItems[selectedIndex];
          if (user) currentCommand?.({ id: user.id, label: user.username });
          return true;
        }
        if (event.key === "Escape") {
          popup?.remove();
          popup = null;
          return true;
        }
        return false;
      },

      onExit: () => {
        popup?.remove();
        popup = null;
      },
    };
  },
};

export default suggestion;
