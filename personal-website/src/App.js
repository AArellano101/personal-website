import "./App.css";
import Header from "./components/Header.jsx";
import Section from "./components/Section.jsx";
import Experience from "./components/Experience.jsx";
import Project from "./components/Project.jsx";
import data from "./components/static/data.json";
const s = data.sections;
const exs = data.experiences;
const ps = data.projects;

function App() {
  return (
    <div className="App">
      <Header />
      <Section name="About" d={s.about} />
      <hr></hr>
      <Section name="Experience" d={s.experience} />
      {exs.map((ex) => (
        <Experience key={ex} e={ex} />
      ))}
      <Section name="Projects" d={s.projects} />
      <div className="project-display">
        {ps.map((p) => (
          <Project key={p} project={p} />
        ))}
      </div>
      <Section name="Contact Me" d={s.contact} />
    </div>
  );
}

export default App;
