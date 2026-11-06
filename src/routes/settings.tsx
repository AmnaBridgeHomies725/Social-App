import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import "../styles/Settings.css";

function SettingsPage() {
  return (
    <div className="settings-page">
      <h1 className="text-2xl font-bold text-black">
        Settings Page
      </h1>

      <Button className="mt-4 bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
        Click Me
      </Button>
	  <Button variant="default">Save</Button>
<Button
  variant="default"
  className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
>
  Save
</Button>
    </div>
  );
}

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});