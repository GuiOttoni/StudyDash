import { createBrowserRouter } from "react-router";
import { App } from "./App";
import { NotFoundPage } from "@/shared/components/ui/NotFoundPage";

import { HomePage } from "@/features/catalog/pages/HomePage";
import { SectionPage } from "@/features/catalog/pages/SectionPage";
import { StudyDetailPage } from "@/features/study-detail/pages/StudyDetailPage";
import { EditStudyPage } from "@/features/study-detail/pages/EditStudyPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { AdminPage } from "@/features/admin/pages/AdminPage";
import { RoadmapPage } from "@/features/roadmap/pages/RoadmapPage";

// Páginas estáticas de padrões/algoritmos — conteúdo curado, uma por padrão.
import BubbleSortPage from "@/features/patterns/pages/bubble-sort/page";
import BuilderPage from "@/features/patterns/pages/builder/page";
import CacheAsidePage from "@/features/patterns/pages/cache-aside/page";
import CompetingConsumersPage from "@/features/patterns/pages/competing-consumers/page";
import ConsumerGroupsPage from "@/features/patterns/pages/consumer-groups/page";
import DiLifetimesPage from "@/features/patterns/pages/di-lifetimes/page";
import DlqPage from "@/features/patterns/pages/dlq/page";
import EventDrivenPage from "@/features/patterns/pages/event-driven/page";
import ExchangePatternsPage from "@/features/patterns/pages/exchange-patterns/page";
import GarbageCollectionPage from "@/features/patterns/pages/garbage-collection/page";
import GraspPage from "@/features/patterns/pages/grasp/page";
import HeapStackPage from "@/features/patterns/pages/heap-stack/page";
import HexagonalArchitecturePage from "@/features/patterns/pages/hexagonal-architecture/page";
import MediatRPage from "@/features/patterns/pages/mediatr/page";
import MergeSortPage from "@/features/patterns/pages/merge-sort/page";
import MicrokernelPage from "@/features/patterns/pages/microkernel/page";
import OopPillarsPage from "@/features/patterns/pages/oop-pillars/page";
import ParallelTasksPage from "@/features/patterns/pages/parallel-tasks/page";
import RecordClassStructPage from "@/features/patterns/pages/record-class-struct/page";
import SingletonPage from "@/features/patterns/pages/singleton/page";
import SolidPage from "@/features/patterns/pages/solid/page";
import ThreadTaskPage from "@/features/patterns/pages/thread-task/page";
import ValueTaskPage from "@/features/patterns/pages/value-task/page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "roadmap",  element: <RoadmapPage /> },
      { path: "admin",    element: <AdminPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "studies/:slug", element: <StudyDetailPage /> },
      { path: "studies/:slug/edit", element: <EditStudyPage /> },

      { path: "patterns/bubble-sort",             element: <BubbleSortPage /> },
      { path: "patterns/builder",                 element: <BuilderPage /> },
      { path: "patterns/cache-aside",              element: <CacheAsidePage /> },
      { path: "patterns/competing-consumers",       element: <CompetingConsumersPage /> },
      { path: "patterns/consumer-groups",           element: <ConsumerGroupsPage /> },
      { path: "patterns/di-lifetimes",              element: <DiLifetimesPage /> },
      { path: "patterns/dlq",                       element: <DlqPage /> },
      { path: "patterns/event-driven",              element: <EventDrivenPage /> },
      { path: "patterns/exchange-patterns",         element: <ExchangePatternsPage /> },
      { path: "patterns/garbage-collection",        element: <GarbageCollectionPage /> },
      { path: "patterns/grasp",                     element: <GraspPage /> },
      { path: "patterns/heap-stack",                element: <HeapStackPage /> },
      { path: "patterns/hexagonal-architecture",    element: <HexagonalArchitecturePage /> },
      { path: "patterns/mediatr",                   element: <MediatRPage /> },
      { path: "patterns/merge-sort",                element: <MergeSortPage /> },
      { path: "patterns/microkernel",               element: <MicrokernelPage /> },
      { path: "patterns/oop-pillars",               element: <OopPillarsPage /> },
      { path: "patterns/parallel-tasks",            element: <ParallelTasksPage /> },
      { path: "patterns/record-class-struct",       element: <RecordClassStructPage /> },
      { path: "patterns/singleton",                 element: <SingletonPage /> },
      { path: "patterns/solid",                     element: <SolidPage /> },
      { path: "patterns/thread-task",               element: <ThreadTaskPage /> },
      { path: "patterns/value-task",                element: <ValueTaskPage /> },

      // Rota genérica para qualquer seção (as originais e as criadas
      // dinamicamente pela geração via IA usam a mesma página) — fica por
      // último para não sombrear as rotas literais acima.
      { path: ":section", element: <SectionPage /> },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
