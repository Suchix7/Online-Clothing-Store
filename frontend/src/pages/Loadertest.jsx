import React from "react";
import SvgLoader from "../components/SvgLoader";
import TechSpinner from "../components/TechSpinner";
import TechSpinner1 from "../components/Tech-spinner";
import { FaAtom } from "react-icons/fa6";
import AtomSpinner from "../components/atomspinner";
import ExactSvgSpinner from "../components/ExactSvgSpinner";

const Loadertest = () => {
  return (
    <div>
      <SvgLoader />
      <TechSpinner />
      <TechSpinner1 />
      <AtomSpinner />
      <ExactSvgSpinner />
    </div>
  );
};

export default Loadertest;
