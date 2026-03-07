import React from "react";
import NavbarPC from "./NavbarPC";
import NavbarMobile from "./NavbarMobile";
import "./Navbar.css";

const Navbar = () => {
  return (
    <header className="navbar-wrapper">
      <div className="navbar-desktop">
        <NavbarPC />
      </div>
      <div className="navbar-mobile">
        <NavbarMobile />
      </div>
    </header>
  );
};

export default Navbar;
