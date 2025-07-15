import type { Route } from "./+types/home";
import ShiftCalculator from "../shift-calculator/ShiftCalculator";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
   const sundays = [
    "2024-06-16",
    "2024-06-23",
    "2024-06-30",
    "2025-07-06",
    "2025-07-13",
    "2025-07-20",
    "2025-07-27",
    "2025-08-03",
    "2025-08-10",
    "2025-08-17",
    "2025-08-24",
    "2025-08-31",
    "2025-09-07",
    "2025-09-14",
    "2025-09-21",
    "2025-09-28",
    "2025-10-05",
    "2025-10-12",
    "2025-10-19",
    "2025-10-26",
    "2025-11-02",
    "2025-11-09",
    "2025-11-16",
    "2025-11-23",
    "2025-11-30",
    "2025-12-07",
    "2025-12-14",
    "2025-12-21",
    "2025-12-28",
  ];
  const holidays = [
    "2024-07-20",
    "2025-07-20",
    "2025-08-07",
    "2025-08-18",
    "2025-10-13",
    "2025-11-03",
    "2025-11-17",
    "2025-12-08",
    "2025-12-25",
  ];

  return (
    <main className="pt-16 p-4 container mx-auto space-y-8">
      <ShiftCalculator sundays={sundays} holidays={holidays} />
    </main>
  );
}
