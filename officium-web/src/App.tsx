import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { TerrainPage } from "./pages/TerrainPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DemosPage } from "./pages/DemosPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<TerrainPage />} />
          <Route path="legacy" element={<DashboardPage />} />
          <Route path="demos" element={<DemosPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
