import "./App.css";
import Header from "./components/Header.jsx";
import Section from "./components/Section.jsx";
import Experience from "./components/Experience.jsx";
import Project from "./components/Project.jsx";
import data from "./components/static/data.json";
const s = data.sections;
const exs = data.experiences;
const ps = data.projects;

const ROW_SIZE = 3;

function App() {
  const splitPs = [];
  for (let i = 0; i < ps.length; i += ROW_SIZE) {
    const split = ps.slice(i, i + ROW_SIZE);
    splitPs.push(split);
  }
  return (
    <div className="App">
      <Header />
      <Section name="About" d={s.about} />
      <Section name="Projects" d={s.projects} />

      <div className="project-display">
        {splitPs?.map((pr, index) => (
          <div key={index} className="project-display-row">
            <Project key={pr[0]} project={pr[0]} />
            <Project key={pr[1]} project={pr[1]} />
            <Project key={pr[2]} project={pr[2]} />
          </div>
        ))}
      </div>

      <Section name="Experience + Education" d={s.experience} />
      {exs.map((ex, index) => (
        <Experience key={index} e={ex} />
      ))}

      <Section name="Contact" d={s.contact} />
    </div>
  );
}

export default App;
