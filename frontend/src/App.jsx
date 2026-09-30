import { Route, Routes } from "react-router-dom";

import CveListPage from "@/pages/CveListPage";
import CveDetailPage from "@/pages/CveDetailPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<CveListPage />} />
      <Route path="/cves/:cveId" element={<CveDetailPage />} />
    </Routes>
  );
}

export default App;
