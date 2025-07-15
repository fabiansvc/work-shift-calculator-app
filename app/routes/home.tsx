import type { Route } from "./+types/home";
import ShiftCalculator from "../shift-calculator/ShiftCalculator";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const sundays = ["2024-06-16", "2024-06-23", "2024-06-30"];
  const holidays = ["2024-07-20"];

  return (
    <main className="pt-16 p-4 container mx-auto space-y-8">
      <ShiftCalculator sundays={sundays} holidays={holidays} />
    </main>
  );
}
