import React from "react";

const Section = (props) => {
  return (
    <div className="section" id={props.name}>
      <div className="section-title">{props.name}</div>
      <div className="section-description">{props.d}</div>
    </div>
  );
};

export default Section;
