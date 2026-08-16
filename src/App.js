import { useEffect, useState } from "react";
import "./App.css";
import { loadSiteContent } from "./content";
import NotebookNavigation from "./components/notebook/NotebookNavigation";
import HeroSection from "./components/notebook/HeroSection";
import CurrentWorkSection from "./components/notebook/CurrentWorkSection";
import InterestSection from "./components/notebook/InterestSection";
import ProjectSection from "./components/notebook/ProjectSection";
import MiscSection from "./components/notebook/MiscSection";

function setDocumentMetadata(site) {
  if (!site?.metadata) return;

  document.title = site.metadata.title;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", site.metadata.description);
}

function App() {
  const [content, setContent] = useState(null);
  const [failed, setFailed] = useState(false);
  const [statusUi, setStatusUi] = useState(null);

  useEffect(() => {
    let active = true;

    loadSiteContent({
      onDocument: (key, document) => {
        if (active && key === "ui") setStatusUi(document);
      },
    })
      .then((loadedContent) => {
        if (!active) return;
        setDocumentMetadata(loadedContent.site);
        setContent(loadedContent);
      })
      .catch((error) => {
        console.error(error);
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!content || !window.location.hash) return;
    const hashId = window.location.hash.slice(1).split("?")[0];
    if (hashId.startsWith("interest-")) return;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(hashId)?.scrollIntoView();
      });
    });
  }, [content]);

  if (!content) {
    return (
      <div
        className={`notebook-loader${failed ? " notebook-loader--failed" : ""}`}
        role={statusUi ? (failed ? "alert" : "status") : undefined}
        aria-live={statusUi ? (failed ? "assertive" : "polite") : undefined}
        aria-hidden={statusUi ? undefined : true}
      >
        {statusUi ? <p>{failed ? statusUi.content_error : statusUi.loading}</p> : null}
        <div aria-hidden="true">
        <span />
        <span />
        <span />
        </div>
      </div>
    );
  }

  const { navigation, hero, ui, rightNow, interests, projects, misc } = content;

  return (
    <div className="notebook-app">
      <a className="skip-link" href="#main-content">
        {ui.skip_to_content}
      </a>
      <NotebookNavigation navigation={navigation} />
      <main id="main-content" tabIndex="-1">
        <HeroSection content={hero} />
        <div className="notebook-thread" aria-hidden="true">
          <span className="notebook-thread__branch notebook-thread__branch--one" />
          <span className="notebook-thread__branch notebook-thread__branch--two" />
        </div>
        <div className="notebook-section overview-section">
          <CurrentWorkSection content={rightNow} ui={ui} />
          <InterestSection content={interests} ui={ui} />
        </div>
        <ProjectSection content={projects} ui={ui} />
        <MiscSection content={misc} projects={projects.all} ui={ui} />
      </main>
      <div className="paper-edge" aria-hidden="true" />
    </div>
  );
}

export default App;
