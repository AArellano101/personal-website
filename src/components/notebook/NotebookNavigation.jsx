import { useEffect, useState } from "react";

const tabToneByTarget = {
  "right-now": 1,
  interests: 2,
  projects: 3,
  misc: 4,
};

function NotebookNavigation({ navigation }) {
  const [activeId, setActiveId] = useState(navigation.items[0]?.target);

  useEffect(() => {
    const targets = navigation.items
      .map((item) => document.getElementById(item.target))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-64px 0px -65%", threshold: [0, 0.2, 0.5] }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [navigation.items]);

  return (
    <nav className="notebook-nav" aria-label={navigation.aria_label}>
      <a
        className="notebook-nav__monogram"
        href={`#${navigation.home_target}`}
        aria-label={navigation.home_aria_label}
      >
        <img src="/favicon.ico" alt="" />
      </a>
      <div className="notebook-nav__tabs">
        {navigation.items.map((item, index) => (
          <a
            className={`notebook-tab notebook-tab--${
              tabToneByTarget[item.target] || (index % 4) + 1
            }${
              activeId === item.target ? " is-active" : ""
            }`}
            href={`#${item.target}`}
            key={item.target}
            aria-current={activeId === item.target ? "location" : undefined}
          >
            <span>{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

export default NotebookNavigation;
