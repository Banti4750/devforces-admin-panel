import { useState, useEffect, createContext } from "react";
import Cookies from 'js-cookie'

export const MainContext = createContext(null);

export const MainContextProvider = ({ children }) => {
  const baseurl = 'http://localhost:9000/api/admin'
  const [token, settoken] = useState(null);
  const [user,setuser] = useState(null)
  const [issidebar, setissidebar] = useState(true);

  const getCookies=()=>{
    const tokendata=Cookies.get('token')
    const userdata= Cookies.get('user')
    console.log(userdata)
    settoken(tokendata)
    if(userdata){
      setuser(JSON.parse(userdata))
    }
  }

  // Detect screen size and set issidebar accordingly
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <1024) {
        setissidebar(false);
      } else {
        setissidebar(true);
      }
    };

    handleResize(); // check on mount
    window.addEventListener("resize", handleResize); // listen for resize

    return () => window.removeEventListener("resize", handleResize); // cleanup
  }, []);

  useEffect(()=>{
    getCookies()
  },[])

  return (
    <MainContext.Provider value={{ token, settoken, issidebar, setissidebar,baseurl,getCookies }}>
      {children}
    </MainContext.Provider>
  );
};
