// tabs component
// split into content, this is where I would use slots in svelte...
// instead we will use a provider/consumer model.

import {
  createContext,
  toChildArray,
  type ComponentChildren,
  type VNode,
} from "preact";
import { useContext, useEffect, useState } from "preact/hooks";
import { getTabState, setTabState } from "src/html/util";

const TabContext = createContext<string>("");

export type TabsProps = {
  qs: string;
  children: ComponentChildren;
};

// @TODO - store tab state in URL to enable back/forward buttons and
//         URL sharing.

export function Tabs({ qs, children }: TabsProps) {
  const labels = toChildArray(children).map((c) => {
    const { id, label } = (c as VNode<TabProps>).props;
    return { id, label };
  });
  const ids = labels.map((x) => x.id);
  const [tab, setTab] = useState(getTabState(qs));
  const wrapSetTab = (x: string) => {
    setTab(x);
    setTabState(qs, x);
  };
  useEffect(() => {
    if (ids.length && !ids.includes(tab)) {
      wrapSetTab(ids[0]!);
    }
  }, [tab, ...ids]);

  return (
    <TabContext.Provider value={tab}>
      <ul class="tab-triggers">
        {labels.map((l) => {
          const active = l.id === tab;
          const onclick = () => {
            wrapSetTab(l.id);
          };
          return (
            <li class={active ? "active" : ""}>
              <button onClick={onclick}>{l.label}</button>
            </li>
          );
        })}
      </ul>
      {children}
    </TabContext.Provider>
  );
}

export type TabProps = {
  label: ComponentChildren;
  id: string;
  children: ComponentChildren;
};

export function Tab({ id, children }: TabProps) {
  const context = useContext(TabContext);
  return context === id && <div class="tab-content">{children}</div>;
}
