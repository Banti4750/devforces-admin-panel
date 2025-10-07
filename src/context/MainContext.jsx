import { useState, useEffect, createContext } from "react";

export const MainContext = createContext(null);

export const MainContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isSidebar, setIsSidebar] = useState(true);

  // 🔹 Fetch user from localStorage or cookies
  const getUser = () => {
    try {
      const userData =
        localStorage.getItem("userData")
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        return parsed;
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to parse userData:", err);
      setUser(null);
    }
  };

  // 🔹 Detect screen size and handle sidebar visibility
  useEffect(() => {
    const handleResize = () => {
      setIsSidebar(window.innerWidth >= 1024);
    };

    handleResize(); // check on mount
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🔹 Load user data when the component mounts
  useEffect(() => {
    getUser();
  }, []);

  return (
    <MainContext.Provider
      value={{
        isSidebar,
        setIsSidebar,
        user,
        setUser,
        getUser,
      }}
    >
      {children}
    </MainContext.Provider>
  );
};
