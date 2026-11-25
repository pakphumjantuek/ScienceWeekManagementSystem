import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./Redux/store.ts";
import { ModalProvider } from "./components/modals/ModalContext.tsx";
import ScrollToTop from "./components/ScrollToTop.tsx";

//local
createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <ModalProvider>
      <BrowserRouter>
        <ScrollToTop />
        <App />
      </BrowserRouter>
    </ModalProvider>
  </Provider>,
);

//Server
// createRoot(document.getElementById("root")!).render(
//   <Provider store={store}>
//     <ModalProvider>
//       <BrowserRouter basename="/ScienceWeek">
//         <ScrollToTop />
//         <App />
//       </BrowserRouter>
//     </ModalProvider>
//   </Provider>,
// );

//ServerPreJect
// createRoot(document.getElementById("root")!).render(
//   <Provider store={store}>
//     <ModalProvider>
//       <ScrollToTop />
//       <BrowserRouter basename="/cs67/react/s14/rovmn">
//         <App />
//       </BrowserRouter>
//     </ModalProvider>
//   </Provider>,
// );
