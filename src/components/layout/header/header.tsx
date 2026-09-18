import { MainHeader } from "./main-header";
import { Navigation } from "./navigation";
import { TopBar } from "./top-bar";

export function Header() {
  return (
    <header>
      <TopBar />
      <MainHeader />
      <Navigation />
    </header>
  );
}
