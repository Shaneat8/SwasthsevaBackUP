
import loadingGif from "../assets/Logo.mp4";

function Spinner() {
  return (
    <div className="spinner-parent">
      <img src={loadingGif} alt="Loading spinner" className="loading-video" />
      <p>Loading...</p>
    </div>
  );
}

export default Spinner;