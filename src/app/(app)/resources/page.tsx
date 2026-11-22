import { InfoNotice } from "@/components/sourced";
import { ResourceSteps } from "./resource-steps";

export default function ResourcesPage() {
  return (
    <div id="v-resources">
      <div className="res">
        <h1>Resources</h1>
        <p className="muted" style={{ margin: 0 }}>
          What to do before and after you arrive: visas, residence registration, offices and embassies. For Erasmus
          Studies students, Bachelor and Master.
        </p>
        <InfoNotice />
        <ResourceSteps />
      </div>
    </div>
  );
}
