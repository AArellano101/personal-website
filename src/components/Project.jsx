import React, { useEffect, useState } from "react";
import backarrow from "./static/icons/icons8-back-arrow-100.png";
import frontarrow from "./static/icons/icons8-forward-button-100.png";

const Collab = () => {
  return <></>;
};
const Project = (props) => {
  const pr = props.project;
  const s = pr.skills;
  const es = pr.exskills;
  const imgl = pr.img.length;

  const [hover, setHover] = useState(true);
  const [imageSlide, setImageSlide] = useState(0);

  function handleIncrement(e) {
    const forward = e.target.id == "forward";
    if (forward && imageSlide != imgl - 1) {
      setImageSlide(imageSlide + 1);
    } else if (!forward && imageSlide != 0) {
      setImageSlide(imageSlide - 1);
    }
  }

  return (
    <div
      className="project"
      id={pr.title}
      onMouseEnter={() => {
        setHover(true);
      }}
      onMouseLeave={() => {
        setHover(false);
      }}
    >
      <a href={pr.link}>
        <div className="p-title">{pr.title}</div>
        <div className="skill-display">
          {s?.map((skill) => (
            <span className="skill">{skill}</span>
          ))}
          {hover
            ? es.map((skill) => <span className="skill">{skill}</span>)
            : null}
        </div>
        <div className="p-description">
          {pr.d}
          {hover ? pr.exd : null}
        </div>
      </a>
      {hover && imgl != 0 ? (
        <div className="arrows">
          <input
            type="image"
            id="backward"
            className="arrow"
            src={backarrow}
            onClick={handleIncrement}
          />
          <input
            type="image"
            id="forward"
            className="arrow"
            src={frontarrow}
            onClick={handleIncrement}
          />
          <div className="image-count">
            {imageSlide + 1}/{imgl}
          </div>
        </div>
      ) : null}
      <a href={pr.link}>
        {imgl != 0 ? (
          <img className="p-img" src={pr.img[imageSlide]} alt="specific"></img>
        ) : null}
      </a>
    </div>
  );
};

export default Project;
