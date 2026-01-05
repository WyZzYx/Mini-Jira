import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "./context/AuthContext";
import { I18N } from "./i18n/strings";
import { LS_LANG } from "./utils/constants";

import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import ProjectsPage from "./pages/ProjectsPage";
import MyTasksPage from "./pages/MyTasksPage";
import AdminPage from "./pages/AdminPage";
import ProjectPage from "./pages/ProjectPage/ProjectPage";
import RegisterPage from "./pages/RegisterPage.jsx";


export default function App() {
    const { token } = useAuth();

    const [lang, setLang] = useState(localStorage.getItem(LS_LANG) || "en");
    const t = useMemo(() => (key) => (I18N[lang]?.[key] ?? key), [lang]);

    useEffect(() => {
        localStorage.setItem(LS_LANG, lang);
    }, [lang]);

    // projects | project | myTasks | admin
    const [route, setRoute] = useState({ name: "projects" });

    if (!token) {
        if (route.name === "register") {
            return (
                <RegisterPage
                    t={t}
                    lang={lang}
                    setLang={setLang}
                    onGoLogin={() => setRoute({ name: "login" })}
                />
            );
        }

        // default login screen
        return (
            <LoginPage
                t={t}
                lang={lang}
                setLang={setLang}
                onGoRegister={() => setRoute({ name: "register" })}
            />
        );
    }

    const activeKey = route.name === "project" ? "projects" : route.name;

    const title =
        route.name === "projects"
            ? t("projects")
            : route.name === "myTasks"
                ? t("myTasks")
                : route.name === "admin"
                    ? "Admin"
                    : t("project");

    const onNavigate = (key) => setRoute({ name: key });

    return (
        <Layout
            t={t}
            lang={lang}
            setLang={setLang}
            title={title}
            activeKey={activeKey}
            onNavigate={onNavigate}
        >
            {route.name === "projects" && (
                <ProjectsPage
                    t={t}
                    onOpenProject={(id) => setRoute({ name: "project", projectId: id })}
                />
            )}

            {route.name === "myTasks" && (
                <MyTasksPage
                    t={t}
                    onOpenProject={(id) => setRoute({ name: "project", projectId: id })}
                    onOpenTask={(projectId, taskId) => {
                        setRoute({ name: "project", projectId, openTaskId: taskId });
                    }}
                />
            )}

            {route.name === "admin" && <AdminPage t={t} />}

            {route.name === "project" && (
                <ProjectPage
                    t={t}
                    projectId={route.projectId}
                    openTaskId={route.openTaskId} // optional support (see patch below)
                    onBack={() => setRoute({ name: "projects" })}
                />
            )}
        </Layout>
    );
}
