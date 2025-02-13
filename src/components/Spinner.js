import React from "react";
import { Spin } from "antd";

function Spinner() {
  return (
    <div className="spinner-parent">
      <Spin size="large" /><br/>
      <p className="">Loading....</p>
    </div>
  );
}

export default Spinner; 

