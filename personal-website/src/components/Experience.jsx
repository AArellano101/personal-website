import React from "react";

const Experience = (props) => {
  const ex = props.e;
  return (
    <div className="experience" id={ex.title}>
      <div className="e-title">
        {ex.title} <span className="e-date">{ex.term}</span>
      </div>
      <div className="e-location">{ex.location}</div>
      <div className="e-description">
        {ex.d?.map((pt, index) => (
          <div key={index}>
            - {pt}
            <br />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Experience;
