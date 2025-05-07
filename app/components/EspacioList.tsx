import React from "react";
import React360Viewer from "react-360-view";

const Product360Viewer = () => {
  return (
    <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
      <React360Viewer
        amount={8}
        imagePath="/images/product/"
        fileName="image-360.jpeg"
        spinReverse
        autoplay
      />
    </div>
  );
};

export default Product360Viewer;
