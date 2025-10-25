import "./index.css";
import {AppShell, Text} from "@mantine/core";
import { AppHeader } from "./components/AppHeader.tsx";
import { HashRouter, Route, Routes } from "react-router-dom";
import { useUserContext } from "./context/UserContext.ts";

export function App() {
    const { user } = useUserContext();
    return (
        <AppShell header={{ height: 66 }}>
            <HashRouter>
                <AppHeader />
                <Routes>
                    <Route path="/" element={<Text>Home</Text>} />
                </Routes>
            </HashRouter>
        </AppShell>
    );
}
