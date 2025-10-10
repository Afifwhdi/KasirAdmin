import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Outlet } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <Header />
      <div className="flex flex-1 w-full">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Index;
